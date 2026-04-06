'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ACPSubiect, ACPComparabila, ACPAnalysisResult } from '@/types'

interface PrintData {
  subiect: ACPSubiect
  comparabile: ACPComparabila[]
  result: ACPAnalysisResult
}

const NAVY = '#0f2557'

function fmt(n: number) {
  return '€' + new Intl.NumberFormat('ro-RO').format(n)
}

function locatie(o: { judet?: string; localitate?: string; adresa_stradala?: string }) {
  return [o.adresa_stradala, o.localitate, o.judet].filter(Boolean).join(', ')
}

function ReportContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<PrintData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const key = searchParams.get('key')
    if (!key) { setError(true); return }
    const raw = localStorage.getItem(key)
    if (!raw) { setError(true); return }
    try {
      setData(JSON.parse(raw))
      localStorage.removeItem(key)
    } catch {
      setError(true)
    }
  }, [searchParams])

  if (error) return (
    <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#64748b' }}>
      Datele raportului nu au putut fi incarcate. Va rugam sa generati din nou analiza.
    </div>
  )
  if (!data) return (
    <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#64748b' }}>
      Se incarca raportul...
    </div>
  )

  const { subiect, comparabile, result } = data
  const dateRo = new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
  const avgPretMp = Math.round(
    comparabile.reduce((s, c) => s + c.pret_cerut / c.suprafata, 0) / comparabile.length
  )
  const subiectPretMp = subiect.suprafata > 0
    ? Math.round(result.pret_recomandat / subiect.suprafata)
    : 0
  const isClientAbove = subiect.pret_solicitat != null && subiect.pret_solicitat > result.pret_recomandat_max
  const isClientBelow = subiect.pret_solicitat != null && subiect.pret_solicitat < result.pret_recomandat_min

  const subiectRows: [string, string][] = [
    ['Tip proprietate', subiect.tip],
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

  const tdStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }
  const thStyle: React.CSSProperties = { padding: '8px 10px', background: '#f1f5f9', fontSize: 12, color: '#475569', textAlign: 'left' as const, fontWeight: 600 }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', fontFamily: 'Arial, sans-serif', color: '#1e293b' }}>

      {/* Print button — hidden on print */}
      <div className="no-print" style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => window.print()}
          style={{
            background: NAVY, color: 'white', border: 'none', borderRadius: 8,
            padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          🖨 Printeaza / Salveaza ca PDF
        </button>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, marginBottom: 24, borderBottom: `3px solid ${NAVY}` }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-hcp.png" alt="HCP" style={{ height: 48, width: 'auto' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: NAVY }}>
            Analiza Comparativa de Piata
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
            {subiect.tip} &bull; {locatie(subiect)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Data raportului</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{dateRo}</div>
        </div>
      </div>

      {/* Subject property */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Proprietatea subiect
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 13 }}>
        <tbody>
          {subiectRows.reduce<[string, string][][]>((rows, item, i) => {
            if (i % 3 === 0) rows.push([])
            rows[rows.length - 1].push(item)
            return rows
          }, []).map((row, ri) => (
            <tr key={ri}>
              {row.map(([label, value], ci) => (
                <td key={ci} style={{ ...tdStyle, width: '33%', background: ri % 2 === 0 ? '#f8fafc' : 'white' }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </td>
              ))}
              {/* Pad last row */}
              {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, pi) => (
                <td key={`pad-${pi}`} style={{ ...tdStyle, background: ri % 2 === 0 ? '#f8fafc' : 'white' }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Price summary box */}
      <div style={{ background: NAVY, color: 'white', borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Pret recomandat</div>
        <div style={{ fontSize: 36, fontWeight: 700, margin: '6px 0' }}>{fmt(result.pret_recomandat)}</div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>
          Interval: {fmt(result.pret_recomandat_min)} &mdash; {fmt(result.pret_recomandat_max)}
        </div>
        {subiect.pret_solicitat && (
          <div style={{ marginTop: 10, fontSize: 13, background: 'rgba(255,255,255,0.12)', borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>
            Pret solicitat client: {fmt(subiect.pret_solicitat)} &mdash;{' '}
            <span style={{ color: isClientAbove ? '#fca5a5' : isClientBelow ? '#fdba74' : '#86efac' }}>
              {isClientAbove ? 'peste intervalul recomandat' : isClientBelow ? 'sub intervalul recomandat' : 'in intervalul recomandat ✓'}
            </span>
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Pret mediu/mp comparabile: {fmt(avgPretMp)}/mp
        </div>
      </div>

      {/* Price comparison table (replaces visual chart) */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Comparatie preturi
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th style={thStyle}>Proprietate</th>
            <th style={{ ...thStyle, textAlign: 'right' as const }}>Pret total</th>
            <th style={{ ...thStyle, textAlign: 'right' as const }}>Euro/mp</th>
            <th style={{ ...thStyle, textAlign: 'right' as const }}>Suprafata</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 600, color: NAVY }}>Proprietatea subiect (recomandat)</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{fmt(result.pret_recomandat)}</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{subiectPretMp > 0 ? `${fmt(subiectPretMp)}/mp` : '—'}</td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>{subiect.suprafata} mp</td>
          </tr>
          {comparabile.map((c, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
              <td style={tdStyle}>Comparabila {i + 1} &mdash; {locatie(c)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(c.pret_cerut)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(Math.round(c.pret_cerut / c.suprafata))}/mp</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{c.suprafata} mp</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Comparabile detail table */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Proprietati comparabile
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 12 }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Adresa / Zona</th>
            <th style={thStyle}>Sup.</th>
            <th style={thStyle}>Cam.</th>
            <th style={thStyle}>Etaj</th>
            <th style={thStyle}>Stare</th>
            <th style={thStyle}>Pret cerut</th>
            <th style={thStyle}>€/mp</th>
            <th style={thStyle}>Observatii AI</th>
          </tr>
        </thead>
        <tbody>
          {comparabile.map((c, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
              <td style={{ ...tdStyle, color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
              <td style={{ ...tdStyle, fontWeight: 500 }}>{locatie(c)}</td>
              <td style={tdStyle}>{c.suprafata} mp</td>
              <td style={tdStyle}>{c.nr_camere ?? '—'}</td>
              <td style={tdStyle}>{c.etaj || '—'}</td>
              <td style={tdStyle}>{c.stare ?? '—'}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{fmt(c.pret_cerut)}</td>
              <td style={tdStyle}>{fmt(Math.round(c.pret_cerut / c.suprafata))}/mp</td>
              <td style={{ ...tdStyle, color: '#64748b', fontSize: 11 }}>{result.observatii_comparabile[i] ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Analysis */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Analiza
      </h2>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18, lineHeight: 1.7, fontSize: 13, whiteSpace: 'pre-line', marginBottom: 32 }}>
        {result.analiza}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
        Raport generat de platforma HCP Imobiliare &bull; Date cu caracter informativ
      </div>
    </div>
  )
}

export default function PDFPreviewPage() {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        body { background: white; }
      `}</style>
      <Suspense fallback={<div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#64748b' }}>Se incarca...</div>}>
        <ReportContent />
      </Suspense>
    </>
  )
}
