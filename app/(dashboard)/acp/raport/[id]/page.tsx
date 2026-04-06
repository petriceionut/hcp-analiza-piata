import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ACPSubiect, ACPComparabila, ACPAnalysisResult } from '@/types'

const NAVY = '#0f2557'

function fmt(n: number) {
  return '€' + new Intl.NumberFormat('ro-RO').format(n)
}

function locatie(o: { judet?: string; localitate?: string; adresa_stradala?: string }) {
  return [o.adresa_stradala, o.localitate, o.judet].filter(Boolean).join(', ')
}

export default async function ACPRaportPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('acp_rapoarte')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!data) notFound()

  const { subiect, comparabile, result } = data.result_json as {
    subiect: ACPSubiect
    comparabile: ACPComparabila[]
    result: ACPAnalysisResult
  }

  const dateRo = new Date(data.created_at).toLocaleDateString('ro-RO', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const avgPretMp = Math.round(
    comparabile.reduce((s: number, c: ACPComparabila) => s + c.pret_cerut / c.suprafata, 0) / comparabile.length
  )
  const subiectPretMp = subiect.suprafata > 0 ? Math.round(result.pret_recomandat / subiect.suprafata) : 0
  const isClientAbove = subiect.pret_solicitat != null && subiect.pret_solicitat > result.pret_recomandat_max
  const isClientBelow = subiect.pret_solicitat != null && subiect.pret_solicitat < result.pret_recomandat_min

  const tdStyle = 'px-3 py-2.5 text-sm border-b border-slate-100'
  const thStyle = 'px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 text-left'

  return (
    <div className="p-6 max-w-4xl">
      {/* Back + Export */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Inapoi la dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{dateRo}</span>
          {data.nome_proprietar && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
              {data.nome_proprietar}
            </span>
          )}
        </div>
      </div>

      {/* Report header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-hcp.png" alt="HCP" style={{ height: '44px' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: NAVY }}>
              Analiza Comparativa de Piata
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{subiect.tip} · {locatie(subiect)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Data raportului</p>
            <p className="text-sm font-semibold text-slate-700">{dateRo}</p>
          </div>
        </div>
        <div className="h-0.5" style={{ backgroundColor: NAVY }} />
      </div>

      {/* Navy summary */}
      <div className="rounded-2xl p-6 text-white mb-5" style={{ backgroundColor: NAVY }}>
        <p className="text-blue-200 text-sm mb-1">Pret recomandat</p>
        <p className="text-4xl font-bold">{fmt(result.pret_recomandat)}</p>
        <p className="text-blue-200 mt-2 text-sm">
          Interval: {fmt(result.pret_recomandat_min)} — {fmt(result.pret_recomandat_max)}
        </p>
        {subiect.pret_solicitat && (
          <p className="mt-3 text-sm bg-white/10 rounded-lg px-3 py-2 inline-block">
            Pret solicitat: {fmt(subiect.pret_solicitat)} —{' '}
            <span className={isClientAbove ? 'text-red-300' : isClientBelow ? 'text-orange-300' : 'text-green-300'}>
              {isClientAbove ? 'peste interval' : isClientBelow ? 'sub interval' : 'in interval ✓'}
            </span>
          </p>
        )}
        <p className="mt-3 text-blue-300 text-xs">Pret mediu/mp comparabile: {fmt(avgPretMp)}/mp</p>
      </div>

      {/* Price comparison table */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Comparatie preturi</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th className={thStyle}>Proprietate</th>
              <th className={thStyle + ' text-right'}>Pret total</th>
              <th className={thStyle + ' text-right'}>€/mp</th>
              <th className={thStyle + ' text-right'}>Suprafata</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-blue-50/50">
              <td className={tdStyle + ' font-semibold'} style={{ color: NAVY }}>Proprietatea subiect (recomandat)</td>
              <td className={tdStyle + ' text-right font-bold'}>{fmt(result.pret_recomandat)}</td>
              <td className={tdStyle + ' text-right'}>{subiectPretMp > 0 ? `${fmt(subiectPretMp)}/mp` : '—'}</td>
              <td className={tdStyle + ' text-right'}>{subiect.suprafata} mp</td>
            </tr>
            {comparabile.map((c: ACPComparabila, i: number) => (
              <tr key={i}>
                <td className={tdStyle}>Comp. {i + 1} — {locatie(c)}</td>
                <td className={tdStyle + ' text-right'}>{fmt(c.pret_cerut)}</td>
                <td className={tdStyle + ' text-right'}>{fmt(Math.round(c.pret_cerut / c.suprafata))}/mp</td>
                <td className={tdStyle + ' text-right'}>{c.suprafata} mp</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparabile detail */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Proprietati comparabile ({comparabile.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={thStyle}>#</th>
                <th className={thStyle}>Zona</th>
                <th className={thStyle}>Sup.</th>
                <th className={thStyle}>Cam.</th>
                <th className={thStyle}>Etaj</th>
                <th className={thStyle}>Stare</th>
                <th className={thStyle}>Pret</th>
                <th className={thStyle}>€/mp</th>
                <th className={thStyle}>Obs. AI</th>
              </tr>
            </thead>
            <tbody>
              {comparabile.map((c: ACPComparabila, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                  <td className={tdStyle + ' text-slate-400 font-medium'}>{i + 1}</td>
                  <td className={tdStyle + ' font-medium'}>
                    {c.link_anunt
                      ? <a href={c.link_anunt} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{locatie(c)}</a>
                      : locatie(c)}
                  </td>
                  <td className={tdStyle}>{c.suprafata} mp</td>
                  <td className={tdStyle}>{c.nr_camere ?? '—'}</td>
                  <td className={tdStyle}>{c.etaj || '—'}</td>
                  <td className={tdStyle}>{c.stare ?? '—'}</td>
                  <td className={tdStyle + ' font-semibold'}>{fmt(c.pret_cerut)}</td>
                  <td className={tdStyle}>{fmt(Math.round(c.pret_cerut / c.suprafata))}/mp</td>
                  <td className={tdStyle + ' text-xs text-slate-500'}>{result.observatii_comparabile[i] ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Analiza</h3>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{result.analiza}</p>
      </div>
    </div>
  )
}
