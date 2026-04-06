import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ACPSubiect, ACPComparabila, ACPAnalysisResult } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subiect, comparabile, result } = await request.json() as {
    subiect: ACPSubiect
    comparabile: ACPComparabila[]
    result: ACPAnalysisResult
  }

  const fmt = (n: number) => '€' + new Intl.NumberFormat('ro-RO').format(n)

  const subiectRows = [
    ['Tip', subiect.tip],
    ['Adresa / Zona', subiect.adresa],
    subiect.tip === 'Casa/Vila'
      ? ['Suprafata utila', `${subiect.suprafata} mp`]
      : ['Suprafata', `${subiect.suprafata} mp`],
    subiect.suprafata_teren ? ['Suprafata teren', `${subiect.suprafata_teren} mp`] : null,
    subiect.nr_camere ? ['Nr camere', String(subiect.nr_camere)] : null,
    subiect.nr_etaje ? ['Nr etaje', `${subiect.nr_etaje}${subiect.mansarda ? ' + mansarda' : ''}`] : null,
    subiect.mansarda && !subiect.nr_etaje ? ['Mansarda', 'Da'] : null,
    subiect.etaj ? ['Etaj', subiect.etaj] : null,
    subiect.an_constructie ? ['An constructie', String(subiect.an_constructie)] : null,
    subiect.stare ? ['Stare', subiect.stare] : null,
    subiect.deschidere_strada ? ['Deschidere la strada', `${subiect.deschidere_strada} m`] : null,
    subiect.clasificare ? ['Clasificare', subiect.clasificare] : null,
    subiect.utilitati?.length ? ['Utilitati', subiect.utilitati.join(', ')] : null,
    subiect.pret_solicitat ? ['Pret solicitat client', fmt(subiect.pret_solicitat)] : null,
  ].filter(Boolean) as [string, string][]

  const compRows = comparabile.map((c, i) => {
    const pretMp = Math.round(c.pret_cerut / c.suprafata)
    const obs = result.observatii_comparabile[i] ?? ''
    return `<tr>
      <td>${c.adresa}</td>
      <td>${c.suprafata} mp</td>
      <td>${c.nr_camere ?? '-'}</td>
      <td>${c.etaj ?? '-'}</td>
      <td>${c.stare ?? '-'}</td>
      <td>${fmt(c.pret_cerut)}</td>
      <td>${fmt(pretMp)}/mp</td>
      <td style="font-size:12px;color:#64748b">${obs}</td>
    </tr>`
  }).join('')

  const avgPretMp = Math.round(
    comparabile.reduce((s, c) => s + c.pret_cerut / c.suprafata, 0) / comparabile.length
  )

  const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>ACP — ${subiect.adresa}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:960px;margin:0 auto;padding:40px 20px;color:#1e293b}
    h1{color:#7c3aed;border-bottom:3px solid #7c3aed;padding-bottom:10px;margin-bottom:4px}
    h2{color:#334155;margin-top:28px;margin-bottom:10px;font-size:16px}
    .meta{color:#64748b;font-size:13px;margin-bottom:24px}
    .subiect-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
    .s-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
    .s-label{font-size:11px;color:#94a3b8;margin-bottom:3px}
    .s-val{font-size:14px;font-weight:600;color:#1e293b}
    .price-box{background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border-radius:12px;padding:28px;margin:20px 0}
    .main-price{font-size:40px;font-weight:700;margin:8px 0}
    table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
    th{background:#f1f5f9;padding:9px 10px;text-align:left;font-size:12px;color:#475569}
    td{padding:9px 10px;border-bottom:1px solid #e2e8f0}
    .analiza{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;line-height:1.7;font-size:14px;white-space:pre-line}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:11px}
    @media print{body{padding:20px}}
  </style>
</head>
<body>
  <h1>Analiza Comparativa de Piata</h1>
  <p class="meta">HCP Imobiliare &bull; ${new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

  <h2>Proprietatea subiect</h2>
  <div class="subiect-grid">
    ${subiectRows.map(([l, v]) => `<div class="s-item"><div class="s-label">${l}</div><div class="s-val">${v}</div></div>`).join('')}
  </div>

  <div class="price-box">
    <div style="font-size:13px;opacity:.8">Pret recomandat</div>
    <div class="main-price">${fmt(result.pret_recomandat)}</div>
    <div style="font-size:15px;opacity:.85;margin-top:4px">Interval: ${fmt(result.pret_recomandat_min)} — ${fmt(result.pret_recomandat_max)}</div>
    <div style="margin-top:12px;font-size:14px;opacity:.8">Pret mediu/mp comparabile: ${fmt(avgPretMp)}/mp</div>
  </div>

  <h2>Analiza</h2>
  <div class="analiza">${result.analiza}</div>

  <h2>Comparabile (${comparabile.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Adresa / Zona</th><th>Suprafata</th><th>Camere</th><th>Etaj</th>
        <th>Stare</th><th>Pret cerut</th><th>€/mp</th><th>Observatii</th>
      </tr>
    </thead>
    <tbody>${compRows}</tbody>
  </table>

  <div class="footer">Raport generat de platforma HCP Imobiliare &bull; Date cu caracter informativ</div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="ACP-${subiect.adresa.slice(0, 30).replace(/\s+/g, '-')}-${Date.now()}.html"`,
    },
  })
}
