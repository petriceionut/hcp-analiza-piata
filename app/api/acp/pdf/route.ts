import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ACPResult, ACPRequest } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { result, request: acpRequest, textQuery } = await request.json() as {
    result: ACPResult
    request?: ACPRequest
    textQuery?: string
  }

  const html = generateReportHTML(result, acpRequest, textQuery)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="analiza-piata-${Date.now()}.html"`,
    },
  })
}

function generateReportHTML(result: ACPResult, acpRequest?: ACPRequest, textQuery?: string): string {
  const formatEUR = (n: number) =>
    new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n)

  const propertyInfo = acpRequest
    ? `
      <table>
        <tr><td><strong>Tip proprietate</strong></td><td>${acpRequest.tip_proprietate}</td></tr>
        <tr><td><strong>Judet</strong></td><td>${acpRequest.judet}</td></tr>
        <tr><td><strong>Localitate</strong></td><td>${acpRequest.localitate}</td></tr>
        <tr><td><strong>Suprafata</strong></td><td>${acpRequest.suprafata_mp} mp</td></tr>
        ${acpRequest.nr_camere ? `<tr><td><strong>Nr. camere</strong></td><td>${acpRequest.nr_camere}</td></tr>` : ''}
        ${acpRequest.an_constructie ? `<tr><td><strong>An constructie</strong></td><td>${acpRequest.an_constructie}</td></tr>` : ''}
        ${acpRequest.etaj ? `<tr><td><strong>Etaj</strong></td><td>${acpRequest.etaj}</td></tr>` : ''}
        ${acpRequest.observatii ? `<tr><td><strong>Observatii</strong></td><td>${acpRequest.observatii}</td></tr>` : ''}
      </table>`
    : textQuery
    ? `<p><em>"${textQuery}"</em></p>`
    : ''

  const comparabileRows = result.proprietati_comparabile
    .map(
      (p) => `
        <tr>
          <td>${p.adresa}</td>
          <td>${p.suprafata} mp</td>
          <td>${p.nr_camere ?? '-'}</td>
          <td>${p.an_constructie ?? '-'}</td>
          <td>${formatEUR(p.pret)}</td>
          <td>${formatEUR(p.pret_mp)}/mp</td>
          <td>${p.sursa}</td>
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analiza Comparativa de Piata — HCP Imobiliare</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; color: #1e293b; }
    h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
    h2 { color: #334155; margin-top: 30px; }
    .price-box { background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; padding: 30px; border-radius: 12px; margin: 20px 0; }
    .price-box .main-price { font-size: 48px; font-weight: bold; margin: 10px 0; }
    .price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
    .price-item { background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; text-align: center; }
    .price-item .label { font-size: 12px; opacity: 0.8; }
    .price-item .value { font-size: 20px; font-weight: bold; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 13px; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    tr:hover td { background: #f8fafc; }
    .factors { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .factor-box { padding: 20px; border-radius: 8px; }
    .positive { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .negative { background: #fff7ed; border: 1px solid #fed7aa; }
    .factor-box h3 { margin-top: 0; }
    .factor-box ul { margin: 0; padding-left: 20px; }
    .factor-box li { margin-bottom: 8px; font-size: 14px; }
    .analiza { background: #f8fafc; padding: 20px; border-radius: 8px; line-height: 1.7; white-space: pre-line; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Analiza Comparativa de Piata</h1>
  <p style="color:#64748b">Generat de HCP Imobiliare &bull; ${new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

  ${propertyInfo ? `<h2>Proprietatea analizata</h2>${propertyInfo}` : ''}

  <div class="price-box">
    <div style="font-size:14px;opacity:0.8">Pret recomandat</div>
    <div class="main-price">${formatEUR(result.recomandare_pret)}</div>
    <div style="font-size:14px;opacity:0.8">Pret mediu/mp: ${formatEUR(Math.round(result.pret_mp_mediu))}/mp</div>
    <div class="price-grid">
      <div class="price-item"><div class="label">Pret minim</div><div class="value">${formatEUR(result.pret_minim)}</div></div>
      <div class="price-item"><div class="label">Pret median</div><div class="value">${formatEUR(result.pret_median)}</div></div>
      <div class="price-item"><div class="label">Pret maxim</div><div class="value">${formatEUR(result.pret_maxim)}</div></div>
    </div>
  </div>

  <h2>Analiza AI</h2>
  <div class="analiza">${result.analiza_text}</div>

  <div class="factors">
    <div class="factor-box positive">
      <h3 style="color:#16a34a">✓ Factori pozitivi</h3>
      <ul>${result.factori_pozitivi.map((f) => `<li>${f}</li>`).join('')}</ul>
    </div>
    <div class="factor-box negative">
      <h3 style="color:#ea580c">⚠ Factori negativi / riscuri</h3>
      <ul>${result.factori_negativi.map((f) => `<li>${f}</li>`).join('')}</ul>
    </div>
  </div>

  ${
    result.proprietati_comparabile.length > 0
      ? `<h2>Proprietati comparabile</h2>
         <table>
           <thead>
             <tr>
               <th>Adresa</th>
               <th>Suprafata</th>
               <th>Camere</th>
               <th>An</th>
               <th>Pret</th>
               <th>Pret/mp</th>
               <th>Sursa</th>
             </tr>
           </thead>
           <tbody>${comparabileRows}</tbody>
         </table>`
      : ''
  }

  <div class="footer">
    <p>Raport generat automat de platforma HCP Imobiliare &bull; Datele au caracter informativ</p>
  </div>
</body>
</html>`
}
