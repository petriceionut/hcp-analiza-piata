import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Supabase (service role — bypasses RLS) ──────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

const N8N_WEBHOOK = 'https://phimlwgsahtksocglifl.supabase.co/functions/v1/signwell-trimite'

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

  const contractText = typeof body.contractText === 'string' ? body.contractText : ''
  const clientEmail  = typeof body.clientEmail  === 'string' ? body.clientEmail  : ''
  const clientName   = typeof body.clientName   === 'string' ? body.clientName   : 'Client'

  console.log(`[trimite] 1 OK – clientEmail=${clientEmail} clientName=${clientName}`)

  if (!clientEmail) {
    return NextResponse.json({ error: 'clientEmail is required' }, { status: 400 })
  }

  // ── 2. Call n8n webhook (n8n handles SignWell) ─────────────────────────────
  let n8nStatus = 0
  let n8nBody   = ''
  try {
    const n8nPayload = { contractText, clientEmail, clientName, contractId }
    console.log(`[trimite] 2 – POST ${N8N_WEBHOOK} | clientEmail=${clientEmail} contractId=${contractId}`)

    const n8nRes = await fetch(N8N_WEBHOOK, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(n8nPayload),
    })

    n8nStatus = n8nRes.status
    n8nBody   = await n8nRes.text()
    console.log(`[trimite] 2 – n8n response status=${n8nStatus} body=${n8nBody}`)

    if (!n8nRes.ok) {
      return NextResponse.json(
        { error: 'n8n webhook error', detail: n8nBody, httpStatus: n8nStatus },
        { status: 502 },
      )
    }
  } catch (e) {
    console.error('[trimite] 2 FAIL – fetch to n8n:', e)
    return NextResponse.json({ error: 'Failed to reach n8n webhook', detail: String(e) }, { status: 502 })
  }

  // ── 3. Parse n8n response for documentId (best-effort) ────────────────────
  let documentId: string | null = null
  try {
    const n8nData = n8nBody ? JSON.parse(n8nBody) : {}
    documentId =
      (n8nData?.documentId     as string | undefined) ??
      (n8nData?.id             as string | undefined) ??
      (n8nData?.data?.id       as string | undefined) ??
      null
    console.log(`[trimite] 3 OK – documentId=${documentId}`)
  } catch (e) {
    console.warn('[trimite] 3 WARN – could not parse n8n response (non-fatal):', e)
  }

  // ── 4. Update Supabase (best-effort — n8n already succeeded) ──────────────
  try {
    const supabase = getSupabase()
    const update: Record<string, unknown> = { status: 'trimis_client' }
    if (documentId) update.signwell_document_id = documentId

    const { error } = await supabase.from('contracts').update(update).eq('id', contractId)
    if (error) {
      console.error('[trimite] 4 WARN – Supabase update failed (non-fatal):', error)
    } else {
      console.log(`[trimite] 4 OK – Supabase updated status=trimis_client`)
    }
  } catch (e) {
    console.error('[trimite] 4 WARN – Supabase threw (non-fatal):', e)
  }

  // ── 5. Return success ──────────────────────────────────────────────────────
  console.log(`[trimite] DONE contractId=${contractId} documentId=${documentId}`)
  return NextResponse.json({ success: true, documentId })
}
