// PDF export is handled client-side via /acp/pdf-preview (window.open + localStorage)
export async function POST() {
  return new Response(JSON.stringify({ error: 'Use /acp/pdf-preview instead' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  })
}
