import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CONTRACT_TYPES, PROPERTY_TYPES } from '@/lib/utils'
import { ClientData, PropertyData } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .eq('agent_id', user.id)
    .single()

  if (error || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  const html = generateContractHTML(contract)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="contract-${params.id}.html"`,
    },
  })
}

function generateContractHTML(contract: {
  tip_contract: string
  client_data: ClientData
  property_data: PropertyData
  derogari?: string
  client_semnatura?: string
  agent_semnatura?: string
  client_semnat_la?: string
  agent_semnat_la?: string
  created_at: string
}): string {
  const c = contract.client_data
  const p = contract.property_data
  const contractTypeLabel = CONTRACT_TYPES[contract.tip_contract as keyof typeof CONTRACT_TYPES] ?? contract.tip_contract
  const propertyTypeLabel = PROPERTY_TYPES[p.tip_proprietate as keyof typeof PROPERTY_TYPES] ?? p.tip_proprietate
  const date = new Date(contract.created_at).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>${contractTypeLabel}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 60px 40px; color: #000; font-size: 14px; line-height: 1.8; }
    h1 { text-align: center; font-size: 20px; margin-bottom: 5px; }
    .subtitle { text-align: center; color: #555; margin-bottom: 40px; }
    .section { margin: 25px 0; }
    .section-title { font-weight: bold; font-size: 15px; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 10px; vertical-align: top; }
    td:first-child { font-weight: bold; width: 40%; }
    .signature-area { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .signature-box { border-top: 1px solid #000; padding-top: 10px; text-align: center; }
    .signature-img { max-width: 200px; max-height: 80px; margin: 10px auto; display: block; }
    .derogari { background: #fffbeb; border: 1px solid #d97706; padding: 15px; border-radius: 6px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${contractTypeLabel.toUpperCase()}</h1>
  <div class="subtitle">Incheiat astazi, ${date}</div>

  <div class="section">
    <div class="section-title">PARTILE CONTRACTANTE</div>
    <p><strong>AGENTUL IMOBILIAR:</strong> HCP Imobiliare, reprezentant autorizat</p>
    <p><strong>CLIENTUL:</strong> ${c.prenume} ${c.nume}, CNP: ${c.cnp}, posesor al BI/CI seria ${c.serie_buletin} nr. ${c.nr_buletin}, domiciliat in ${c.adresa_domiciliu}, tel: ${c.telefon}${c.email ? `, email: ${c.email}` : ''}</p>
  </div>

  <div class="section">
    <div class="section-title">OBIECTUL CONTRACTULUI</div>
    <table>
      <tr><td>Tip proprietate</td><td>${propertyTypeLabel}</td></tr>
      <tr><td>Adresa</td><td>${p.adresa}</td></tr>
      ${p.suprafata_construita ? `<tr><td>Suprafata construita</td><td>${p.suprafata_construita} mp</td></tr>` : ''}
      ${p.suprafata_utila ? `<tr><td>Suprafata utila</td><td>${p.suprafata_utila} mp</td></tr>` : ''}
      ${p.suprafata_teren ? `<tr><td>Suprafata teren</td><td>${p.suprafata_teren} mp</td></tr>` : ''}
      ${p.nr_cadastral ? `<tr><td>Nr. cadastral</td><td>${p.nr_cadastral}</td></tr>` : ''}
      ${p.nr_carte_funciara ? `<tr><td>Nr. carte funciara</td><td>${p.nr_carte_funciara}</td></tr>` : ''}
      ${p.nr_camere ? `<tr><td>Nr. camere</td><td>${p.nr_camere}</td></tr>` : ''}
      ${p.etaj ? `<tr><td>Etaj</td><td>${p.etaj}</td></tr>` : ''}
      ${p.an_constructie ? `<tr><td>An constructie</td><td>${p.an_constructie}</td></tr>` : ''}
    </table>
  </div>

  <div class="section">
    <div class="section-title">CLAUZE GENERALE</div>
    <p>Prezentul contract a fost incheiat cu buna credinta, in conformitate cu prevederile Codului Civil Roman si ale legislatiei in vigoare privind activitatea de intermediere imobiliara.</p>
    <p>Agentul imobiliar se angajeaza sa depuna toate eforturile pentru indeplinirea obiectului contractului, actionand in interesul clientului si cu respectarea normelor etice profesionale.</p>
    <p>Clientul confirma ca informatiile furnizate sunt corecte si complete, si ca are dreptul de a incheia prezentul contract.</p>
  </div>

  ${contract.derogari ? `
  <div class="section">
    <div class="section-title">CLAUZE SPECIALE / DEROGARI</div>
    <div class="derogari">${contract.derogari}</div>
  </div>` : ''}

  <div class="signature-area">
    <div class="signature-box">
      <strong>AGENT IMOBILIAR</strong>
      ${contract.agent_semnatura ? `<img class="signature-img" src="${contract.agent_semnatura}" alt="Semnatura agent" />` : '<div style="height:80px"></div>'}
      ${contract.agent_semnat_la ? `<div style="font-size:11px;color:#666">Semnat la: ${new Date(contract.agent_semnat_la).toLocaleString('ro-RO')}</div>` : ''}
    </div>
    <div class="signature-box">
      <strong>CLIENT: ${c.prenume} ${c.nume}</strong>
      ${contract.client_semnatura ? `<img class="signature-img" src="${contract.client_semnatura}" alt="Semnatura client" />` : '<div style="height:80px"></div>'}
      ${contract.client_semnat_la ? `<div style="font-size:11px;color:#666">Semnat la: ${new Date(contract.client_semnat_la).toLocaleString('ro-RO')}</div>` : ''}
    </div>
  </div>
</body>
</html>`
}
