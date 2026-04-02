import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

const APP_URL = 'https://hcp-analiza-piata.vercel.app'

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[trimite] RESEND_API_KEY not set — email not sent to', to)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'HCP Analiza Piata <noreply@homoecapital.ro>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('[trimite] Resend error:', res.status, body)
  }
}

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
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const contractText = typeof body.contractText === 'string' ? body.contractText : ''
  const clientEmail  = typeof body.clientEmail  === 'string' ? body.clientEmail  : ''
  const clientName   = typeof body.clientName   === 'string' ? body.clientName   : 'Client'

  console.log(`[trimite] clientEmail=${clientEmail} clientName=${clientName}`)

  if (!clientEmail) {
    return NextResponse.json({ error: 'clientEmail is required' }, { status: 400 })
  }
  if (!contractText) {
    return NextResponse.json({ error: 'contractText is required' }, { status: 400 })
  }

  const supabase = getSupabase()

  // ── 2. Save signature request (generates a unique token) ──────────────────
  const { data: sigReq, error: insertErr } = await supabase
    .from('signature_requests')
    .insert({
      contract_id:   contractId,
      client_email:  clientEmail,
      client_name:   clientName,
      contract_text: contractText,
      status:        'pending',
    })
    .select('token')
    .single()

  if (insertErr || !sigReq) {
    console.error('[trimite] failed to insert signature_request:', insertErr)
    return NextResponse.json(
      { error: 'Nu s-a putut crea cererea de semnătură', detail: insertErr?.message },
      { status: 500 },
    )
  }

  const signingToken = sigReq.token
  const signingLink  = `${APP_URL}/semneaza/${signingToken}`
  console.log(`[trimite] signingLink=${signingLink}`)

  // ── 3. Send signing link email to client ──────────────────────────────────
  try {
    await sendEmail(
      clientEmail,
      'Document de semnat — HCP Analiza Piata',
      `<p>Bună ziua, <strong>${clientName}</strong>,</p>
      <p>Vă rugăm să citiți și să semnați documentul la linkul de mai jos:</p>
      <p><a href="${signingLink}" style="font-size:16px;font-weight:bold;">${signingLink}</a></p>
      <p>Linkul este valabil o singură dată.</p>
      <p>Mulțumim,<br/>Echipa HCP Analiza Piata</p>`,
    )
  } catch (e) {
    console.warn('[trimite] email send failed (non-fatal):', e)
  }

  // ── 4. Update contract status (best-effort) ────────────────────────────────
  try {
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'trimis_client' })
      .eq('id', contractId)
    if (error) console.warn('[trimite] contract status update failed (non-fatal):', error)
    else console.log(`[trimite] contract ${contractId} → trimis_client`)
  } catch (e) {
    console.warn('[trimite] contract update threw (non-fatal):', e)
  }

  console.log(`[trimite] DONE contractId=${contractId} token=${signingToken}`)
  return NextResponse.json({ success: true, signingToken, signingLink })
}
