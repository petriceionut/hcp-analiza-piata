import { createClient } from '@/lib/supabase/server'
import path from 'path'
import type { ACPSubiect, ACPComparabila, ACPAnalysisResult } from '@/types'

// pdfkit must be imported this way in Next.js App Router
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit')

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { subiect, comparabile, result } = await request.json() as {
    subiect: ACPSubiect
    comparabile: ACPComparabila[]
    result: ACPAnalysisResult
  }

  const fmt = (n: number) => '\u20AC' + new Intl.NumberFormat('ro-RO').format(n)
  const locatie = (o: { judet?: string; localitate?: string; adresa_stradala?: string }) =>
    [o.adresa_stradala, o.localitate, o.judet].filter(Boolean).join(', ')
  const dateRo = new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })

  const avgPretMp = Math.round(
    comparabile.reduce((s, c) => s + c.pret_cerut / c.suprafata, 0) / comparabile.length
  )

  const NAVY  = '#0f2557'
  const LIGHT = '#f1f5f9'
  const GRAY  = '#64748b'
  const BLACK = '#1e293b'

  // Collect PDF bytes into a buffer
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', resolve)
    doc.on('error', reject)

    const W = doc.page.width   // 595
    const L = 50               // left margin
    const R = W - 50           // right margin
    const CW = R - L           // content width

    // ── HEADER ────────────────────────────────────────────────────────────────
    const logoPath = path.join(process.cwd(), 'public', 'logo-hcp.png')
    try {
      doc.image(logoPath, L, 40, { height: 40 })
    } catch {
      // logo missing — skip silently
    }

    // Title block (right-aligned)
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY)
      .text('ANALIZA COMPARATIVA DE PIATA', L, 42, { align: 'right' })
    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text(`${subiect.tip} \u2022 ${locatie(subiect)}`, L, 57, { align: 'right' })
    doc.font('Helvetica').fontSize(8).fillColor(GRAY)
      .text(dateRo, L, 70, { align: 'right' })

    // Navy divider
    doc.moveDown(0.5)
    const divY = 88
    doc.rect(L, divY, CW, 2).fill(NAVY)
    doc.moveDown(1)

    // ── PROPRIETATEA SUBIECT ──────────────────────────────────────────────────
    let y = divY + 14
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
      .text('Proprietatea subiect', L, y)
    y += 18

    const subiectRows: [string, string][] = [
      ['Tip', subiect.tip],
      ['Judet', subiect.judet],
      ['Localitate', subiect.localitate],
      ...(subiect.adresa_stradala ? [['Adresa', subiect.adresa_stradala] as [string, string]] : []),
      [subiect.tip === 'Casa/Vila' ? 'Suprafata utila' : 'Suprafata', `${subiect.suprafata} mp`],
      ...(subiect.suprafata_teren ? [['Suprafata teren', `${subiect.suprafata_teren} mp`] as [string, string]] : []),
      ...(subiect.nr_camere ? [['Nr camere', String(subiect.nr_camere)] as [string, string]] : []),
      ...(subiect.nr_etaje ? [['Nr etaje', `${subiect.nr_etaje}${subiect.mansarda ? ' + mansarda' : ''}`] as [string, string]] : []),
      ...(subiect.mansarda && !subiect.nr_etaje ? [['Mansarda', 'Da'] as [string, string]] : []),
      ...(subiect.etaj ? [['Etaj', subiect.etaj] as [string, string]] : []),
      ...(subiect.an_constructie ? [['An constructie', String(subiect.an_constructie)] as [string, string]] : []),
      ...(subiect.stare ? [['Stare', subiect.stare] as [string, string]] : []),
      ...(subiect.deschidere_strada ? [['Deschidere la strada', `${subiect.deschidere_strada} m`] as [string, string]] : []),
      ...(subiect.clasificare ? [['Clasificare', subiect.clasificare] as [string, string]] : []),
      ...(subiect.utilitati?.length ? [['Utilitati', subiect.utilitati.join(', ')] as [string, string]] : []),
      ...(subiect.pret_solicitat ? [['Pret solicitat client', fmt(subiect.pret_solicitat)] as [string, string]] : []),
    ]

    // Render as 3-column grid of small cards
    const cardW = (CW - 8) / 3
    const cardH = 36
    const cols = 3
    subiectRows.forEach(([label, value], idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const cx = L + col * (cardW + 4)
      const cy = y + row * (cardH + 4)
      doc.rect(cx, cy, cardW, cardH).fill(LIGHT)
      doc.font('Helvetica').fontSize(7).fillColor(GRAY)
        .text(label, cx + 6, cy + 6, { width: cardW - 12 })
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
        .text(value, cx + 6, cy + 17, { width: cardW - 12 })
    })
    y += Math.ceil(subiectRows.length / cols) * (cardH + 4) + 10

    // ── PRICE BOX ─────────────────────────────────────────────────────────────
    const boxH = subiect.pret_solicitat ? 80 : 68
    doc.rect(L, y, CW, boxH).fill(NAVY)

    doc.font('Helvetica').fontSize(9).fillColor('#93c5fd')
      .text('Pret recomandat', L + 16, y + 10)
    doc.font('Helvetica-Bold').fontSize(26).fillColor('#ffffff')
      .text(fmt(result.pret_recomandat), L + 16, y + 22)
    doc.font('Helvetica').fontSize(9).fillColor('#bfdbfe')
      .text(`Interval: ${fmt(result.pret_recomandat_min)} \u2014 ${fmt(result.pret_recomandat_max)}`, L + 16, y + 52)
    if (subiect.pret_solicitat) {
      const isAbove = subiect.pret_solicitat > result.pret_recomandat_max
      const isBelow = subiect.pret_solicitat < result.pret_recomandat_min
      const statusText = isAbove ? 'peste intervalul recomandat' : isBelow ? 'sub intervalul recomandat' : 'in intervalul recomandat'
      doc.font('Helvetica').fontSize(8).fillColor('#fde68a')
        .text(`Pret solicitat client: ${fmt(subiect.pret_solicitat)} \u2014 ${statusText}`, L + 16, y + 65)
    }
    doc.font('Helvetica').fontSize(8).fillColor('#93c5fd')
      .text(`Pret mediu/mp comparabile: ${fmt(avgPretMp)}/mp`, R - 160, y + 10, { width: 150, align: 'right' })
    y += boxH + 14

    // ── COMPARATII PRETURI ────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
      .text('Comparatie preturi', L, y)
    y += 14

    // Header row
    doc.rect(L, y, CW, 16).fill(LIGHT)
    doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY)
    const colWidths = [130, 70, 50, 50, 80, 80, CW - 460]
    const colHeaders = ['Adresa / Zona', 'Suprafata', 'Camere', 'Etaj', 'Pret cerut', '\u20AC/mp', 'Observatii AI']
    let cx = L + 4
    colHeaders.forEach((h, i) => {
      doc.text(h, cx, y + 4, { width: colWidths[i] })
      cx += colWidths[i]
    })
    y += 16

    // Comp rows
    comparabile.forEach((c, i) => {
      const pretMp = Math.round(c.pret_cerut / c.suprafata)
      const obs = result.observatii_comparabile[i] ?? ''
      const rowH = obs.length > 60 ? 32 : 20
      if (i % 2 === 0) doc.rect(L, y, CW, rowH).fill('#f8fafc')

      const vals = [
        locatie(c),
        `${c.suprafata} mp`,
        c.nr_camere ? String(c.nr_camere) : '-',
        c.etaj || '-',
        fmt(c.pret_cerut),
        `${fmt(pretMp)}/mp`,
        obs,
      ]
      cx = L + 4
      doc.font('Helvetica').fontSize(8).fillColor(BLACK)
      vals.forEach((v, j) => {
        doc.text(v, cx, y + 5, { width: colWidths[j] - 4, ellipsis: true })
        cx += colWidths[j]
      })
      y += rowH
    })

    // Bottom border
    doc.moveTo(L, y).lineTo(R, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
    y += 14

    // ── ANALIZA ───────────────────────────────────────────────────────────────
    // Add new page if not enough space
    if (y > 650) { doc.addPage(); y = 50 }

    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text('Analiza', L, y)
    y += 14
    doc.font('Helvetica').fontSize(9).fillColor(BLACK)
      .text(result.analiza, L, y, { width: CW, lineGap: 2 })

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const pageCount = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1
    for (let p = 0; p < pageCount; p++) {
      if (p > 0) doc.switchToPage(p)
      doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
        .text(
          'Raport generat de platforma HCP Imobiliare \u2022 Date cu caracter informativ',
          L, doc.page.height - 35, { width: CW, align: 'center' }
        )
    }

    doc.end()
  })

  const pdfBuffer = Buffer.concat(chunks)
  const filename = `ACP-${(subiect.localitate || subiect.judet).replace(/\s+/g, '-')}-${Date.now()}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
