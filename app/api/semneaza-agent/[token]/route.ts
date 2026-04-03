import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const AGENT_NAME     = 'Petrice Ioan'
const AGENT_EMAIL    = 'joan.petrice@homoecapital.ro'
const APP_URL        = 'https://hcp-analiza-piata.vercel.app'
const STORAGE_BUCKET = 'contracte-semnate'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Europe/Bucharest',
  })
}

function parseUserAgent(ua: string): string {
  let browser = 'Browser'
  if (ua.includes('Edg/'))       browser = `Edge ${ua.match(/Edg\/(\d+)/)?.[1] ?? ''}`
  else if (ua.includes('Chrome')) browser = `Chrome ${ua.match(/Chrome\/(\d+)/)?.[1] ?? ''}`
  else if (ua.includes('Firefox')) browser = `Firefox ${ua.match(/Firefox\/(\d+)/)?.[1] ?? ''}`
  else if (ua.includes('Safari'))  browser = `Safari ${ua.match(/Version\/(\d+)/)?.[1] ?? ''}`

  let os = 'OS'
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11'
  else if (ua.includes('Windows'))    os = 'Windows'
  else if (ua.includes('Mac OS X'))   os = 'macOS'
  else if (ua.includes('Android'))    os = `Android ${ua.match(/Android (\d+)/)?.[1] ?? ''}`
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux'))      os = 'Linux'

  return `${browser} / ${os}`
}

// ── PDF generation with both signature blocks ─────────────────────────────────
async function generateFinalPDF(
  contractText: string,
  client: { name: string; email: string; telefon: string; ip: string; device: string; signedAt: string },
  agent:  { name: string; email: string; ip: string; device: string; signedAt: string },
): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')
  const doc  = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxW   = pageW - 2 * margin
  let y        = margin

  const checkPage = () => { if (y > pageH - 20) { doc.addPage(); y = margin } }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  for (const rawLine of contractText.split('\n')) {
    const wrapped = doc.splitTextToSize(rawLine || ' ', maxW)
    for (const line of wrapped) {
      checkPage()
      doc.text(line, margin, y)
      y += 5
    }
  }

  // ── Client signature block ──────────────────────────────────────────────────
  y += 10; checkPage()
  doc.setDrawColor(100)
  doc.line(margin, y, pageW - margin, y); y += 6
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('SEMNATURA ELECTRONICA - CLIENT', margin, y); y += 6
  doc.setFont('helvetica', 'normal')
  for (const sl of [
    `Semnat electronic de: ${client.name}`,
    `Email: ${client.email}`,
    ...(client.telefon ? [`Telefon: ${client.telefon}`] : []),
    `Adresa IP: ${client.ip}`,
    `Dispozitiv: ${client.device}`,
    `Data si ora: ${client.signedAt}`,
  ]) {
    checkPage(); doc.text(sl, margin, y); y += 5
  }
  y += 4; doc.line(margin, y, pageW - margin, y)

  // ── Agent signature block ───────────────────────────────────────────────────
  y += 10; checkPage()
  doc.line(margin, y, pageW - margin, y); y += 6
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('SEMNATURA ELECTRONICA - AGENT', margin, y); y += 6
  doc.setFont('helvetica', 'normal')
  for (const sl of [
    `Semnat electronic de: ${agent.name}`,
    `Email: ${agent.email}`,
    `Adresa IP: ${agent.ip}`,
    `Dispozitiv: ${agent.device}`,
    `Data si ora: ${agent.signedAt}`,
  ]) {
    checkPage(); doc.text(sl, margin, y); y += 5
  }
  y += 4; doc.line(margin, y, pageW - margin, y)

  return Buffer.from(doc.output('arraybuffer'))
}

// ── Upload to Supabase Storage ────────────────────────────────────────────────
async function uploadPDF(
  supabase: ReturnType<typeof adminClient>,
  token: string,
  pdfBuf: Buffer,
): Promise<string | null> {
  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {/* exists */})

  const path = `${token}/contract-final.pdf`
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, pdfBuf, { contentType: 'application/pdf', upsert: true })
  if (error) { console.error('[semneaza-agent] upload error:', error); return null }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ── Send email via Resend ─────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) { console.warn('[semneaza-agent] RESEND_API_KEY not set'); return }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'onboarding@resend.dev', to, subject, html }),
  })
  if (!res.ok) console.error('[semneaza-agent] Resend error:', res.status, await res.text())
}

function completionEmail(
  toName: string,
  clientName: string,
  agentSignedAt: string,
  pdfUrl: string | null,
): string {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#1e40af;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <h1 style="color:white;margin:0;font-size:22px">HCP Imobiliare</h1>
    </div>
    <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
      <p style="font-size:16px;color:#1e293b">Bună ziua, <strong>${toName}</strong>,</p>
      <p style="color:#475569">Contractul cu <strong>${clientName}</strong> a fost semnat de ambele părți.</p>
      <p style="color:#475569">Agent semnat la: <strong>${agentSignedAt}</strong></p>
      ${pdfUrl
        ? `<div style="text-align:center;margin:28px 0">
            <a href="${pdfUrl}" style="background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
              Descarcă PDF final semnat
            </a>
          </div>`
        : ''}
      <p style="color:#94a3b8;font-size:12px;text-align:center">HCP Imobiliare &bull; Platforma de semnătură electronică</p>
    </div>
  </body></html>`
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const token = params.token

  let deviceInfo = ''
  try {
    const body = await request.json()
    deviceInfo = typeof body.deviceInfo === 'string' ? body.deviceInfo : ''
  } catch { /* optional */ }

  const ip     = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'necunoscut'
  const ua     = request.headers.get('user-agent') ?? ''
  const device = deviceInfo || parseUserAgent(ua)

  const supabase      = adminClient()
  const agentSignedAt = new Date()
  const agentSignedAtF = formatDateTime(agentSignedAt)

  // 1. Load signature request
  const { data: sigReq, error: fetchErr } = await supabase
    .from('signature_requests')
    .select(`
      *, contracts ( client_data, property_data, tip_contract, agent_id )
    `)
    .eq('token', token)
    .single()

  if (fetchErr || !sigReq) {
    return NextResponse.json({ error: 'Link invalid sau expirat' }, { status: 404 })
  }
  if (sigReq.status === 'semnat_complet') {
    return NextResponse.json({ error: 'Contract deja semnat complet' }, { status: 409 })
  }
  if (sigReq.status === 'pending') {
    return NextResponse.json({ error: 'Clientul nu a semnat încă' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contract = sigReq.contracts as any
  const telefon: string = contract?.client_data?.telefon ?? ''

  // 2. Generate final PDF with both blocks
  let pdfUrl: string | null = null
  try {
    const pdfBuf = await generateFinalPDF(
      sigReq.contract_text,
      {
        name:     sigReq.client_name,
        email:    sigReq.client_email,
        telefon,
        ip:       sigReq.signer_ip ?? '',
        device:   sigReq.device_info ?? '',
        signedAt: sigReq.signed_at ? formatDateTime(new Date(sigReq.signed_at)) : '',
      },
      {
        name:     AGENT_NAME,
        email:    AGENT_EMAIL,
        ip,
        device,
        signedAt: agentSignedAtF,
      },
    )
    pdfUrl = await uploadPDF(supabase, token, pdfBuf)
  } catch (e) {
    console.error('[semneaza-agent] PDF generation failed (non-fatal):', e)
  }

  // 3. Update signature_requests
  const { error: updateErr } = await supabase
    .from('signature_requests')
    .update({
      status:           'semnat_complet',
      agent_signed_at:  agentSignedAt.toISOString(),
      agent_ip:         ip,
      agent_device_info: device,
      pdf_url:          pdfUrl,
    })
    .eq('id', sigReq.id)

  if (updateErr) {
    console.error('[semneaza-agent] update failed:', updateErr)
    return NextResponse.json({ error: 'Eroare la salvarea semnăturii agentului' }, { status: 500 })
  }

  // 4. Update contracts status (best-effort)
  await supabase
    .from('contracts')
    .update({ status: 'semnat_ambele' })
    .eq('id', sigReq.contract_id)
    .then(({ error }) => { if (error) console.warn('[semneaza-agent] contracts update failed:', error) })

  // 5. Create DealRoom entry (best-effort)
  try {
    if (contract?.agent_id) {
      await supabase.from('dealrooms').insert({
        contract_id:     sigReq.contract_id,
        agent_id:        contract.agent_id,
        tip_proprietate: contract.property_data?.tip_proprietate ?? 'apartament',
        adresa_scurta:   contract.property_data?.adresa ?? '',
        status:          'activ',
      })
      console.log(`[semneaza-agent] DealRoom created for contract ${sigReq.contract_id}`)
    }
  } catch (e) {
    console.warn('[semneaza-agent] DealRoom creation failed (non-fatal):', e)
  }

  // 6. Send completion emails to both parties
  const emailHtml = completionEmail('{NAME}', sigReq.client_name, agentSignedAtF, pdfUrl)

  await Promise.allSettled([
    sendEmail(
      sigReq.client_email,
      'Contractul a fost semnat complet — HCP Imobiliare',
      emailHtml.replace('{NAME}', sigReq.client_name),
    ),
    sendEmail(
      AGENT_EMAIL,
      `Contract semnat complet — ${sigReq.client_name}`,
      emailHtml.replace('{NAME}', AGENT_NAME),
    ),
  ])

  console.log(`[semneaza-agent] DONE token=${token} ip=${ip}`)
  return NextResponse.json({ success: true, pdfUrl })
}
