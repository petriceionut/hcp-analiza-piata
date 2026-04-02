import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'

type ClientRow = { prenume?: string; nume?: string; email?: string } | null

const AGENT_NUME  = 'PETRICE JOAN'
const AGENT_EMAIL = 'joan.petrice@homoecapital.ro'

function generatePdfBase64(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks).toString('base64')))
    doc.on('error', reject)

    const pageWidth = doc.page.width - 100 // account for margins
    const lineHeight = 14
    const lines = text.split('\n')

    for (const rawLine of lines) {
      const line = rawLine.trimEnd()
      if (line === '') {
        doc.moveDown(0.4)
        continue
      }

      const isArticleHeader = /^(Art\.|ART\.)/.test(line)
      doc
        .font(isArticleHeader ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isArticleHeader ? 11 : 10)

      // Check remaining space — add new page if less than 2 line-heights left
      if (doc.y > doc.page.height - doc.page.margins.bottom - lineHeight * 2) {
        doc.addPage()
      }

      doc.text(line, { align: isArticleHeader ? 'left' : 'justify', lineBreak: true })
      if (!isArticleHeader) doc.moveDown(0.1)
    }

    doc.end()
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    // Accept contractText (new) or fall back to pdfBase64 (legacy)
    const contractText: string | undefined = body.contractText
    const pdfBase64Legacy: string | undefined = body.pdfBase64

    if (!contractText && !pdfBase64Legacy) {
      return NextResponse.json({ error: 'contractText is required' }, { status: 400 })
    }

    // Fetch contract
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, client_data, client_data2, tip_contract')
      .eq('id', params.id)
      .eq('agent_id', user.id)
      .single()

    if (fetchError || !contract) {
      console.error('[trimite] Contract not found:', fetchError)
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const c1 = contract.client_data as ClientRow
    const c2 = contract.client_data2 as ClientRow
    const client1Name  = `${c1?.prenume ?? ''} ${c1?.nume ?? ''}`.trim() || 'Client'
    const client1Email = c1?.email ?? ''

    if (!client1Email) {
      return NextResponse.json({ error: 'Client email is missing' }, { status: 400 })
    }

    const apiKey = process.env.SIGNWELL_API_KEY
    console.log('[trimite] SIGNWELL_API_KEY present:', !!apiKey, '| length:', apiKey?.length ?? 0)
    if (!apiKey) {
      return NextResponse.json({ error: 'SIGNWELL_API_KEY not configured' }, { status: 500 })
    }

    // Generate PDF server-side from text (fast, < 1s)
    let pdfBase64: string
    if (contractText) {
      console.log('[trimite] Generating PDF from text | chars:', contractText.length)
      const start = Date.now()
      pdfBase64 = await generatePdfBase64(contractText)
      console.log('[trimite] PDF generated in', Date.now() - start, 'ms | base64 KB:', Math.round(pdfBase64.length / 1024))
    } else {
      pdfBase64 = pdfBase64Legacy!
    }

    // Build recipients
    const recipients: { id: string; name: string; email: string; placeholder_name: string }[] = [
      { id: '1', name: client1Name, email: client1Email, placeholder_name: 'CLIENT_1' },
    ]
    const client2Email = c2?.email ?? ''
    if (client2Email) {
      const client2Name = `${c2?.prenume ?? ''} ${c2?.nume ?? ''}`.trim() || 'Co-proprietar'
      recipients.push({ id: '2', name: client2Name, email: client2Email, placeholder_name: 'CLIENT_2' })
    }

    const agentEmail = user.email ?? AGENT_EMAIL
    const agentName  = (user.user_metadata?.full_name as string | undefined) ?? AGENT_NUME
    const ccs = [{ name: agentName, email: agentEmail }]

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const payload = {
      test_mode: process.env.NODE_ENV !== 'production' ? 1 : 0,
      draft: false,
      name: `Contract ${contract.id}`,
      due_date: dueDateStr,
      files: [{ name: 'contract.pdf', base64_file_contents: pdfBase64 }],
      recipients,
      ccs,
    }

    console.log(
      '[trimite] Sending to SignWell | recipients:',
      recipients.map((r) => `${r.name} <${r.email}>`).join(', '),
      '| cc:', agentEmail,
    )

    const signwellRes = await fetch('https://www.signwell.com/api/v1/documents/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Token': apiKey },
      body: JSON.stringify(payload),
    })

    const responseText = await signwellRes.text()
    console.log('[trimite] SignWell HTTP status:', signwellRes.status)
    console.log('[trimite] SignWell full response:', responseText)

    if (!signwellRes.ok) {
      return NextResponse.json(
        { error: 'SignWell API error', detail: responseText, httpStatus: signwellRes.status },
        { status: 502 }
      )
    }

    // Safely parse SignWell response — body may be empty or non-JSON
    let signwellData: Record<string, unknown> = {}
    try {
      signwellData = responseText ? JSON.parse(responseText) : {}
    } catch (parseErr) {
      console.error('[trimite] Failed to parse SignWell response as JSON:', parseErr, '| raw:', responseText)
      // SignWell returned 200 but unparseable body — treat as success without a document ID
    }
    console.log('[trimite] SignWell parsed response keys:', Object.keys(signwellData))

    // ID may be at response.id or response.data.id depending on API version
    const signwellDocumentId =
      (signwellData?.id as string | undefined) ??
      (signwellData?.data as Record<string, unknown> | undefined)?.id as string | undefined ??
      null

    console.log('[trimite] SignWell document_id:', signwellDocumentId)

    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'trimis_client',
        ...(signwellDocumentId ? { signwell_document_id: signwellDocumentId } : {}),
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('[trimite] Supabase update error:', updateError)
      throw updateError
    }

    console.log('[trimite] Success | signwell_document_id:', signwellDocumentId)
    return NextResponse.json({ signwellDocumentId })
  } catch (err) {
    console.error('[POST /api/contracts/[id]/trimite] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
