import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

const AGENT_EMAIL = 'ioan.petrice@homoecapital.ro'
const APP_URL     = 'https://hcp-analiza-piata.vercel.app'

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[semneaza] RESEND_API_KEY not set — email not sent to', to)
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
    console.error('[semneaza] Resend error:', res.status, body)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const token = params.token
  console.log(`[semneaza] POST token=${token}`)

  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const signerName = typeof body.signerName === 'string' ? body.signerName.trim() : ''
  if (!signerName) {
    return NextResponse.json({ error: 'signerName is required' }, { status: 400 })
  }

  // ── 2. Get signer IP ───────────────────────────────────────────────────────
  const signerIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const supabase = getSupabase()

  // ── 3. Load signature request ──────────────────────────────────────────────
  const { data: sigReq, error: fetchErr } = await supabase
    .from('signature_requests')
    .select('id, contract_id, client_email, client_name, status')
    .eq('token', token)
    .single()

  if (fetchErr || !sigReq) {
    console.error('[semneaza] signature_request not found:', fetchErr)
    return NextResponse.json({ error: 'Link invalid sau expirat' }, { status: 404 })
  }

  if (sigReq.status === 'signed') {
    return NextResponse.json({ error: 'Document deja semnat' }, { status: 409 })
  }

  // ── 4. Mark as signed ─────────────────────────────────────────────────────
  const now = new Date().toISOString()
  const { error: updateSigErr } = await supabase
    .from('signature_requests')
    .update({ status: 'signed', signed_at: now, signer_ip: signerIp })
    .eq('id', sigReq.id)

  if (updateSigErr) {
    console.error('[semneaza] failed to update signature_request:', updateSigErr)
    return NextResponse.json({ error: 'Eroare la salvarea semnăturii' }, { status: 500 })
  }

  // ── 5. Update contract status (best-effort) ────────────────────────────────
  try {
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'semnat_client' })
      .eq('id', sigReq.contract_id)
    if (error) console.warn('[semneaza] contract status update failed (non-fatal):', error)
    else console.log(`[semneaza] contract ${sigReq.contract_id} → semnat_client`)
  } catch (e) {
    console.warn('[semneaza] contract update threw (non-fatal):', e)
  }

  // ── 6. Send confirmation emails (best-effort) ─────────────────────────────
  const signedAtFormatted = new Date(now).toLocaleString('ro-RO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Bucharest',
  })

  // Email to client
  try {
    await sendEmail(
      sigReq.client_email,
      'Document semnat cu succes',
      `<p>Bună ziua, <strong>${signerName}</strong>,</p>
      <p>Documentul a fost semnat cu succes pe data de <strong>${signedAtFormatted}</strong>.</p>
      <p>Agentul dumneavoastră a fost notificat.</p>
      <p>Mulțumim,<br/>Echipa HCP Analiza Piata</p>`,
    )
  } catch (e) {
    console.warn('[semneaza] client email failed (non-fatal):', e)
  }

  // Email to agent
  try {
    await sendEmail(
      AGENT_EMAIL,
      `Document semnat de ${signerName}`,
      `<p>Bună ziua,</p>
      <p>Clientul <strong>${signerName}</strong> (${sigReq.client_email}) a semnat documentul
      pe data de <strong>${signedAtFormatted}</strong>.</p>
      <p>IP semnare: ${signerIp}</p>
      <p><a href="${APP_URL}/contracte/${sigReq.contract_id}">Vezi contractul</a></p>`,
    )
  } catch (e) {
    console.warn('[semneaza] agent email failed (non-fatal):', e)
  }

  console.log(`[semneaza] DONE token=${token} signer=${signerName}`)
  return NextResponse.json({ success: true })
}
