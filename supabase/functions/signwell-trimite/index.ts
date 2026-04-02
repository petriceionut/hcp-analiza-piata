import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SIGNWELL_API_KEY = Deno.env.get('SIGNWELL_API_KEY') ?? ''
const SIGNWELL_API_URL = 'https://www.signwell.com/api/v1/documents/'

// Build a UTF-8 HTML document from contract text.
// HTML handles Romanian characters (ă î ș ț â) natively via charset meta tag.
function buildHtml(contractText: string): string {
  // Convert newlines to <br> and preserve paragraph spacing
  const body = contractText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map((line) => (line.trim() === '' ? '<p>&nbsp;</p>' : `<p>${line}</p>`))
    .join('\n')

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page {
      margin: 2.5cm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      margin: 2.5cm;
      color: #000;
      width: calc(100% - 5cm);
      max-width: none;
    }
    p {
      margin: 0 0 0.2em 0;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 1. Parse request body ─────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const contractText = typeof body.contractText === 'string' ? body.contractText : ''
  const clientEmail  = typeof body.clientEmail  === 'string' ? body.clientEmail  : ''
  const clientName   = typeof body.clientName   === 'string' ? body.clientName   : 'Client'
  const contractId   = typeof body.contractId   === 'string' ? body.contractId   : ''

  console.log(`[signwell-trimite] contractId=${contractId} clientEmail=${clientEmail}`)

  if (!clientEmail) {
    return new Response(JSON.stringify({ error: 'clientEmail is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!SIGNWELL_API_KEY) {
    console.error('[signwell-trimite] SIGNWELL_API_KEY env var not set')
    return new Response(JSON.stringify({ error: 'SIGNWELL_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 2. Build HTML and base64-encode it ───────────────────────────────────
  const html = buildHtml(contractText)
  const htmlBase64 = btoa(unescape(encodeURIComponent(html)))

  // ── 3. Send to SignWell ───────────────────────────────────────────────────
  const signwellPayload = {
    test_mode: false,
    files: [
      {
        name: `contract-${contractId || 'nou'}.html`,
        file_base64: htmlBase64,
      },
    ],
    recipients: [
      {
        id: '1',
        name: clientName,
        email: clientEmail,
        placeholder_name: 'Client',
      },
    ],
    send_email: true,
  }

  console.log(`[signwell-trimite] POST ${SIGNWELL_API_URL}`)

  let swRes: Response
  try {
    swRes = await fetch(SIGNWELL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Token': SIGNWELL_API_KEY,
      },
      body: JSON.stringify(signwellPayload),
    })
  } catch (e) {
    console.error('[signwell-trimite] fetch to SignWell failed:', e)
    return new Response(
      JSON.stringify({ error: 'Failed to reach SignWell', detail: String(e) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const swBody = await swRes.text()
  console.log(`[signwell-trimite] SignWell status=${swRes.status} body=${swBody}`)

  if (!swRes.ok) {
    return new Response(
      JSON.stringify({ error: 'SignWell error', detail: swBody, httpStatus: swRes.status }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ── 4. Return documentId from SignWell response ───────────────────────────
  let documentId: string | null = null
  try {
    const swData = JSON.parse(swBody)
    documentId = swData?.id ?? swData?.documentId ?? null
  } catch {
    console.warn('[signwell-trimite] could not parse SignWell response (non-fatal)')
  }

  console.log(`[signwell-trimite] DONE documentId=${documentId}`)
  return new Response(JSON.stringify({ success: true, documentId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
