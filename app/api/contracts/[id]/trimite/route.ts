import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import PDFDocument from 'pdfkit'

// ─── Supabase (service role — bypasses RLS) ──────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

// ─── pdfkit: text → base64 PDF ───────────────────────────────────────────────
function buildPdfBase64(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const chunks: Buffer[] = []

      doc.on('data', (c: Buffer) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks).toString('base64')))
      doc.on('error', (e: Error) => reject(e))

      const usableWidth = doc.page.width - 100          // 50px margin each side
      const bottomLimit = doc.page.height - doc.page.margins.bottom - 28

      for (const raw of text.split('\n')) {
        const line = raw.trimEnd()

        if (line === '') {
          doc.moveDown(0.35)
          continue
        }

        const isHeading = /^(Art\.|ART\.|ANEXA|CAPITOLUL)/.test(line)
        doc.font(isHeading ? 'Helvetica-Bold' : 'Helvetica').fontSize(isHeading ? 11 : 10)

        if (doc.y > bottomLimit) doc.addPage()

        doc.text(line, {
          width: usableWidth,
          align: isHeading ? 'left' : 'justify',
          lineBreak: true,
        })
        if (!isHeading) doc.moveDown(0.05)
      }

      doc.end()
    } catch (e) {
      reject(e)
    }
  })
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const contractId = params.id
  console.log(`[trimite] START contractId=${contractId}`)

  // ── 1. Parse request body ──────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch (e) {
    console.error('[trimite] 1 FAIL – parse body:', e)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const contractText  = typeof body.contractText  === 'string' ? body.contractText  : ''
  const clientEmail   = typeof body.clientEmail   === 'string' ? body.clientEmail   : ''
  const clientName    = typeof body.clientName    === 'string' ? body.clientName    : 'Client'
  const agentEmail    = typeof body.agentEmail    === 'string' ? body.agentEmail    : ''
  const agentName     = typeof body.agentName     === 'string' ? body.agentName     : 'Agent'

  console.log(`[trimite] 1 OK – clientEmail=${clientEmail} agentEmail=${agentEmail}`)

  if (!clientEmail) {
    return NextResponse.json({ error: 'clientEmail is required' }, { status: 400 })
  }

  // ── 2. Read API key ────────────────────────────────────────────────────────
  const apiKey = process.env.SIGNWELL_API_KEY ?? ''
  console.log(`[trimite] 2 – SIGNWELL_API_KEY present=${!!apiKey} length=${apiKey.length}`)
  if (!apiKey) {
    return NextResponse.json({ error: 'SIGNWELL_API_KEY not configured' }, { status: 500 })
  }

  // ── 3. Generate PDF ────────────────────────────────────────────────────────
  let pdfBase64 = ''
  try {
    const t0 = Date.now()
    pdfBase64 = await buildPdfBase64(contractText || 'Contract')
    console.log(`[trimite] 3 OK – PDF ${Math.round(pdfBase64.length / 1024)} KB in ${Date.now() - t0}ms`)
  } catch (e) {
    console.error('[trimite] 3 FAIL – PDF generation:', e)
    return NextResponse.json({ error: 'PDF generation failed', detail: String(e) }, { status: 500 })
  }

  // ── 4. Call SignWell API ───────────────────────────────────────────────────
  let swStatus = 0
  let swBody   = ''
  try {
    const dueDate = new Date(Date.now() + 14 * 86_400_000).toISOString().split('T')[0]

    const payload = {
      test_mode: false,
      draft:     false,
      name:      `Contract ${contractId}`,
      due_date:  dueDate,
      files:     [{ name: 'contract.pdf', base64_file_contents: pdfBase64 }],
      recipients: [
        { id: '1', name: clientName, email: clientEmail, placeholder_name: 'CLIENT_1' },
      ],
      ...(agentEmail ? { ccs: [{ name: agentName, email: agentEmail }] } : {}),
    }

    console.log(
      `[trimite] 4 – SignWell POST | recipient=${clientEmail}` +
      (agentEmail ? ` cc=${agentEmail}` : '') +
      ` due=${dueDate}`
    )

    const swRes = await fetch('https://www.signwell.com/api/v1/documents/', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    swStatus = swRes.status
    swBody   = await swRes.text()
    console.log(`[trimite] 4 – SignWell response status=${swStatus} body=${swBody}`)

    if (!swRes.ok) {
      return NextResponse.json(
        { error: 'SignWell rejected the request', detail: swBody, httpStatus: swStatus },
        { status: 502 },
      )
    }
  } catch (e) {
    console.error('[trimite] 4 FAIL – fetch to SignWell:', e)
    return NextResponse.json({ error: 'Failed to reach SignWell', detail: String(e) }, { status: 502 })
  }

  // ── 5. Parse SignWell response (best-effort) ───────────────────────────────
  let documentId: string | null = null
  try {
    const swData = swBody ? JSON.parse(swBody) : {}
    documentId =
      (swData?.id          as string | undefined) ??
      (swData?.data?.id    as string | undefined) ??
      null
    console.log(`[trimite] 5 OK – SignWell documentId=${documentId}`)
  } catch (e) {
    console.warn('[trimite] 5 WARN – could not parse SignWell body (non-fatal):', e)
  }

  // ── 6. Update Supabase (best-effort — SignWell already succeeded) ──────────
  try {
    const supabase = getSupabase()
    const update: Record<string, unknown> = { status: 'trimis_client' }
    if (documentId) update.signwell_document_id = documentId

    const { error } = await supabase.from('contracts').update(update).eq('id', contractId)
    if (error) {
      console.error('[trimite] 6 WARN – Supabase update failed (non-fatal):', error)
    } else {
      console.log(`[trimite] 6 OK – Supabase updated status=trimis_client`)
    }
  } catch (e) {
    // Never let a DB error hide the SignWell success from the frontend
    console.error('[trimite] 6 WARN – Supabase threw (non-fatal):', e)
  }

  // ── 7. Return success ──────────────────────────────────────────────────────
  console.log(`[trimite] DONE contractId=${contractId} documentId=${documentId}`)
  return NextResponse.json({ success: true, documentId })
}
