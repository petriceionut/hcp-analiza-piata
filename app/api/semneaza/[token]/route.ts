import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const AGENT_EMAIL      = 'ionutpetrice1224@gmail.com'
const AGENT_NAME       = 'Petrice Ioan'
const APP_URL          = 'https://hcp-analiza-piata.vercel.app'
const STORAGE_BUCKET   = 'contracte-semnate'

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

// ── Sanitize text for jsPDF WinAnsi (Latin-1) encoding ───────────────────────
// 1. NFC-normalise first so decomposed chars (e.g. s + U+0326) become
//    composed codepoints (U+0219 ș) that the regexes can match.
// 2. Explicit Unicode escapes for both Romanian variants of ș/ț.
// 3. Final strip of anything outside Latin-1 that slipped through.
function sanitizeForPdf(text: string): string {
  const nfc = text.normalize('NFC')
  const out = nfc
    // ț (U+021B) and ţ (U+0163) → t
    .replace(/[\u021B\u0163]/g, 't').replace(/[\u021A\u0162]/g, 'T')
    // ș (U+0219) and ş (U+015F) → s
    .replace(/[\u0219\u015F]/g, 's').replace(/[\u0218\u015E]/g, 'S')
    // ă (U+0103) → a
    .replace(/\u0103/g, 'a').replace(/\u0102/g, 'A')
    // î (U+00EE) → i
    .replace(/\u00EE/g, 'i').replace(/\u00CE/g, 'I')
    // â (U+00E2) → a
    .replace(/\u00E2/g, 'a').replace(/\u00C2/g, 'A')
    // Typographic quotes and dashes → plain ASCII
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    // Strip any remaining characters outside Latin-1 (code points > 255)
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\xFF]/g, '?')
  return out
}

let _pdfSanitizeDiagDone = false
function sanitizeForPdfWithDiag(text: string): string {
  const result = sanitizeForPdf(text)
  if (!_pdfSanitizeDiagDone && text !== result) {
    _pdfSanitizeDiagDone = true
    const before = Array.from(text).filter(c => c.codePointAt(0)! > 127).slice(0, 8).map(c => `${c}(U+${c.codePointAt(0)!.toString(16).toUpperCase()})`)
    const after  = Array.from(result).filter(c => c.codePointAt(0)! > 127).slice(0, 8).map(c => `${c}(U+${c.codePointAt(0)!.toString(16).toUpperCase()})`)
    console.log('[pdf-sanitize] non-ASCII before:', before.join(' '), '| after:', after.join(' '))
  }
  return result
}

// ── PDF generation using jsPDF (pure JS, no filesystem) ──────────────────────
async function generatePDF(
  contractText: string,
  client: { name: string; email: string; telefon: string; ip: string; device: string; signedAt: string },
): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxW   = pageW - 2 * margin
  let y        = margin

  const checkPage = () => {
    if (y > pageH - 20) { doc.addPage(); y = margin }
  }

  // ── Contract text ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setCharSpace(0)

  for (const rawLine of contractText.split('\n')) {
    const wrapped = doc.splitTextToSize(sanitizeForPdfWithDiag(rawLine) || ' ', maxW)
    for (const line of wrapped) {
      checkPage()
      doc.text(line, margin, y)
      y += 5
    }
  }

  // ── Client signature block ─────────────────────────────────────────────────
  y += 10
  checkPage()
  doc.setDrawColor(100)
  doc.line(margin, y, pageW - margin, y); y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('SEMNATURA ELECTRONICA - CLIENT', margin, y); y += 6

  doc.setFont('helvetica', 'normal')
  const sigLines = [
    `Semnat electronic de: ${sanitizeForPdfWithDiag(client.name)}`,
    `Email: ${client.email}`,
    ...(client.telefon ? [`Telefon: ${client.telefon}`] : []),
    `Adresa IP: ${client.ip}`,
    `Dispozitiv: ${sanitizeForPdfWithDiag(client.device)}`,
    `Data si ora: ${client.signedAt}`,
  ]
  for (const sl of sigLines) {
    checkPage()
    doc.text(sl, margin, y); y += 5
  }

  y += 4
  doc.line(margin, y, pageW - margin, y)

  return Buffer.from(doc.output('arraybuffer'))
}

// ── Upload PDF to Supabase Storage ────────────────────────────────────────────
async function uploadPDF(supabase: ReturnType<typeof adminClient>, token: string, pdfBuf: Buffer): Promise<string | null> {
  // Ensure bucket exists
  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {/* already exists */})

  const path = `${token}/contract-client.pdf`
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, pdfBuf, { contentType: 'application/pdf', upsert: true })

  if (error) { console.error('[semneaza] upload error:', error); return null }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const token = params.token

  // 1. Parse body
  let deviceInfo = ''
  try {
    const body = await request.json()
    deviceInfo = typeof body.deviceInfo === 'string' ? body.deviceInfo : ''
  } catch { /* optional */ }

  // 2. Capture IP + device
  const ip     = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'necunoscut'
  const ua     = request.headers.get('user-agent') ?? ''
  const device = deviceInfo || parseUserAgent(ua)

  const supabase  = adminClient()
  const signedAt  = new Date()
  const signedAtF = formatDateTime(signedAt)

  // 3. Load signature request + contract
  const { data: sigReq, error: fetchErr } = await supabase
    .from('signature_requests')
    .select(`*, contracts ( client_data, property_data, tip_contract, agent_id )`)
    .eq('token', token)
    .single()

  if (fetchErr || !sigReq) {
    return NextResponse.json({ error: 'Link invalid sau expirat' }, { status: 404 })
  }
  if (sigReq.status === 'signed' || sigReq.status === 'semnat_client' || sigReq.status === 'semnat_complet') {
    return NextResponse.json({ error: 'Document deja semnat' }, { status: 409 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contract = sigReq.contracts as any
  const telefon: string = contract?.client_data?.telefon ?? ''

  // 4. Generate PDF (best-effort)
  let pdfUrl: string | null = null
  try {
    const pdfBuf = await generatePDF(sigReq.contract_text, {
      name: sigReq.client_name,
      email: sigReq.client_email,
      telefon,
      ip,
      device,
      signedAt: signedAtF,
    })
    pdfUrl = await uploadPDF(supabase, token, pdfBuf)
  } catch (e) {
    console.error('[semneaza] PDF generation failed (non-fatal):', e)
  }

  // 5. Update signature_requests — only columns present in v1 migration
  const { error: updateErr } = await supabase
    .from('signature_requests')
    .update({
      status:    'signed',
      signed_at: signedAt.toISOString(),
      signer_ip: ip,
    })
    .eq('id', sigReq.id)

  if (updateErr) {
    console.error('[semneaza] signature_request update failed:', updateErr)
    return NextResponse.json({ error: 'Eroare la salvarea semnăturii' }, { status: 500 })
  }

  // 6. Update contracts status + client signing timestamp
  const { error: contractErr, count: contractCount } = await supabase
    .from('contracts')
    .update({ status: 'semnat_client', client_semnat_la: signedAt.toISOString() }, { count: 'exact' })
    .eq('id', sigReq.contract_id)
  console.log(`[semneaza] contracts update: contract_id=${sigReq.contract_id} rows=${contractCount} err=${contractErr?.message ?? 'none'}`)
  if (contractErr) console.error('[semneaza] contracts status update failed:', contractErr)

  // 7. Email agent with agent signing link
  const agentSigningLink = `${APP_URL}/semneaza-agent/${token}`
  try {
    await sendEmail(
      AGENT_EMAIL,
      `Contractul a fost semnat de client - ${sigReq.client_name}`,
      `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#1e40af;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:22px">HCP Imobiliare</h1>
        </div>
        <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
          <p style="font-size:16px;color:#1e293b">Bună ziua, <strong>${AGENT_NAME}</strong>,</p>
          <p style="color:#475569">Clientul <strong>${sigReq.client_name}</strong> a semnat electronic contractul.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
            <tr><td style="padding:6px 0;color:#64748b">Client:</td><td style="padding:6px 0;color:#1e293b"><strong>${sigReq.client_name}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Email:</td><td style="padding:6px 0;color:#1e293b">${sigReq.client_email}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Semnat la:</td><td style="padding:6px 0;color:#1e293b">${signedAtF}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">IP:</td><td style="padding:6px 0;color:#1e293b">${ip}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Dispozitiv:</td><td style="padding:6px 0;color:#1e293b">${device}</td></tr>
          </table>
          ${pdfUrl ? `<p style="color:#475569">PDF client: <a href="${pdfUrl}">${pdfUrl}</a></p>` : ''}
          <div style="text-align:center;margin:28px 0">
            <a href="${agentSigningLink}" style="background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
              Semnez contractul (agent)
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center">HCP Imobiliare &bull; Platforma de semnătură electronică</p>
        </div>
      </body></html>`,
    )
  } catch (e) {
    console.warn('[semneaza] agent email failed (non-fatal):', e)
  }

  console.log(`[semneaza] DONE token=${token} ip=${ip}`)
  return NextResponse.json({ success: true, pdfUrl })
}
