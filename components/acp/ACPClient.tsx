'use client'

import { useState } from 'react'
import type { ACPSubiect, ACPComparabila, ACPAnalysisResult, ACPStare, ACPTip } from '@/types'
import {
  Loader2, Plus, X, ArrowLeft, ArrowRight, Sparkles, Download,
  Building2, Home, Landmark, Store, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STARI: ACPStare[] = ['Renovata', 'Stare buna', 'Necesita renovare']

const JUDETE = [
  'Alba','Arad','Arges','Bacau','Bihor','Bistrita-Nasaud','Botosani','Brasov',
  'Braila','Buzau','Caras-Severin','Calarasi','Cluj','Constanta','Covasna',
  'Dambovita','Dolj','Galati','Giurgiu','Gorj','Harghita','Hunedoara','Ialomita',
  'Iasi','Ilfov','Maramures','Mehedinti','Mures','Neamt','Olt','Prahova',
  'Satu Mare','Salaj','Sibiu','Suceava','Teleorman','Timis','Tulcea','Vaslui',
  'Valcea','Vrancea','Bucuresti',
]

const SECTOARE = ['Sector 1','Sector 2','Sector 3','Sector 4','Sector 5','Sector 6']

function locatie(obj: { judet?: string; localitate?: string; adresa_stradala?: string }) {
  return [obj.adresa_stradala, obj.localitate, obj.judet].filter(Boolean).join(', ')
}

function locatieScurta(obj: { localitate?: string; judet?: string }) {
  return obj.localitate || obj.judet || '—'
}

const TIP_CARDS: { tip: ACPTip; icon: React.ElementType; label: string }[] = [
  { tip: 'Apartament',     icon: Building2, label: 'Apartament' },
  { tip: 'Casa/Vila',      icon: Home,      label: 'Casa / Vila' },
  { tip: 'Teren',          icon: Landmark,  label: 'Teren' },
  { tip: 'Spatiu Comercial', icon: Store,   label: 'Spatiu Comercial' },
]

const UTILITATI_CASA = ['Gaz', 'Curent', 'Apa/Canalizare', 'Fosa septica', 'Internet']
const UTILITATI_TEREN = ['Gaz', 'Curent', 'Apa', 'Canalizare']

function fmtEUR(n: number) {
  return '€' + new Intl.NumberFormat('ro-RO').format(n)
}

const NAVY = '#0f2557'

// Horizontal bar chart: subject vs comparables by €/mp
function BarChart({ subiect, comps }: { subiect: { label: string; pretMp: number }; comps: { label: string; pretMp: number }[] }) {
  const all = [subiect, ...comps]
  const max = Math.max(...all.map(x => x.pretMp)) * 1.15
  return (
    <div className="space-y-2.5">
      {all.map((item, i) => {
        const isSubiect = i === 0
        const pct = Math.round((item.pretMp / max) * 100)
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-32 text-xs text-slate-600 text-right truncate shrink-0">{item.label}</div>
            <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
              <div
                className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: isSubiect ? NAVY : '#4a90d9' }}
              >
                <span className={`text-xs font-semibold ${isSubiect ? 'text-white' : 'text-white'}`}>
                  {fmtEUR(item.pretMp)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
      <div className="flex gap-4 mt-1 pl-36">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: NAVY }} /> Proprietatea subiect
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#4a90d9' }} /> Comparabile
        </span>
      </div>
    </div>
  )
}

// Price gauge: shows min-max range with markers for recommended and client price
function PriceGauge({ min, max, rec, clientPrice }: { min: number; max: number; rec: number; clientPrice?: number }) {
  const range = max - min
  const padding = range * 0.2
  const lo = min - padding
  const hi = max + padding
  const span = hi - lo
  const toPct = (v: number) => Math.max(0, Math.min(100, ((v - lo) / span) * 100))

  const recPct = toPct(rec)
  const minPct = toPct(min)
  const maxPct = toPct(max)
  const clientPct = clientPrice != null ? toPct(clientPrice) : null

  return (
    <div className="pt-6 pb-2">
      {/* Track */}
      <div className="relative h-4 bg-slate-100 rounded-full">
        {/* Recommended range band */}
        <div
          className="absolute top-0 h-full rounded-full opacity-30"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%`, backgroundColor: NAVY }}
        />
        {/* Min marker */}
        <div className="absolute top-0 h-full w-0.5 bg-slate-400" style={{ left: `${minPct}%` }} />
        {/* Max marker */}
        <div className="absolute top-0 h-full w-0.5 bg-slate-400" style={{ left: `${maxPct}%` }} />
        {/* Recommended dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md -ml-2.5 z-10"
          style={{ left: `${recPct}%`, backgroundColor: NAVY }}
        />
        {/* Client price dot */}
        {clientPct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md -ml-2 z-10 bg-amber-500"
            style={{ left: `${clientPct}%` }}
          />
        )}
      </div>
      {/* Labels below */}
      <div className="relative mt-3 h-8 text-xs text-slate-500">
        <span className="absolute -translate-x-1/2" style={{ left: `${minPct}%` }}>{fmtEUR(min)}</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${maxPct}%` }}>{fmtEUR(max)}</span>
        <span
          className="absolute -translate-x-1/2 font-bold"
          style={{ left: `${recPct}%`, color: NAVY }}
        >{fmtEUR(rec)}</span>
        {clientPct != null && clientPrice != null && (
          <span className="absolute -translate-x-1/2 text-amber-600 font-semibold" style={{ left: `${clientPct}%`, top: '16px' }}>
            {fmtEUR(clientPrice)}
          </span>
        )}
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: NAVY }} /> Pret recomandat
        </span>
        {clientPrice != null && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-full inline-block bg-amber-500" /> Pret solicitat client
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-sm inline-block opacity-40" style={{ backgroundColor: NAVY }} /> Interval recomandat
        </span>
      </div>
    </div>
  )
}

const emptyComp = (): ACPComparabila => ({
  judet: '', localitate: '', adresa_stradala: '',
  suprafata: 0, nr_camere: undefined, etaj: '',
  stare: 'Stare buna', pret_cerut: 0, link_anunt: '',
})

const defaultSubiect = (): ACPSubiect => ({
  tip: 'Apartament', judet: '', localitate: '', adresa_stradala: '',
  suprafata: 0, stare: 'Stare buna',
})

// Which fields to show per type
const showNrCamere = (tip: ACPTip) => tip === 'Apartament' || tip === 'Casa/Vila'
const showEtaj     = (tip: ACPTip) => tip === 'Apartament' || tip === 'Spatiu Comercial'
const showStare    = (tip: ACPTip) => tip !== 'Teren'

export default function ACPClient() {
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ACPAnalysisResult | null>(null)
  const [subiect, setSubiect] = useState<ACPSubiect>(defaultSubiect())
  const [comparabile, setComparabile] = useState<ACPComparabila[]>([emptyComp()])
  const [expanded, setExpanded] = useState<boolean[]>([true])

  const updS = (k: keyof ACPSubiect, v: unknown) =>
    setSubiect(p => ({ ...p, [k]: v }))

  const toggleUtilitate = (item: string) => {
    const cur = subiect.utilitati ?? []
    updS('utilitati', cur.includes(item) ? cur.filter(u => u !== item) : [...cur, item])
  }

  const setTip = (tip: ACPTip) => {
    setSubiect({ ...defaultSubiect(), tip })
  }

  const updC = (i: number, k: keyof ACPComparabila, v: unknown) =>
    setComparabile(p => p.map((c, idx) => idx === i ? { ...c, [k]: v } : c))

  const addComp = () => {
    if (comparabile.length >= 5) return
    setComparabile(p => [...p, emptyComp()])
    setExpanded(p => [...p, true])
  }

  const removeComp = (i: number) => {
    if (i === 0) return
    setComparabile(p => p.filter((_, idx) => idx !== i))
    setExpanded(p => p.filter((_, idx) => idx !== i))
  }

  const toggleExpanded = (i: number) =>
    setExpanded(p => p.map((v, idx) => idx === i ? !v : v))

  const validateStep1 = () => {
    if (!subiect.judet) { toast.error('Selectati judetul'); return false }
    if (!subiect.localitate.trim()) { toast.error('Completati localitatea'); return false }
    if (!subiect.suprafata || subiect.suprafata <= 0) { toast.error('Completati suprafata'); return false }
    return true
  }

  const validateStep2 = () => {
    const c = comparabile[0]
    if (!c.judet) { toast.error('Comparabila 1: selectati judetul'); return false }
    if (!c.localitate.trim()) { toast.error('Comparabila 1: completati localitatea'); return false }
    if (!c.suprafata || c.suprafata <= 0) { toast.error('Comparabila 1: completati suprafata'); return false }
    if (!c.pret_cerut || c.pret_cerut <= 0) { toast.error('Comparabila 1: completati pretul'); return false }
    for (let i = 1; i < comparabile.length; i++) {
      const c2 = comparabile[i]
      const hasAny = c2.judet || c2.localitate || c2.suprafata || c2.pret_cerut
      if (hasAny) {
        if (!c2.judet) { toast.error(`Comparabila ${i + 1}: selectati judetul`); return false }
        if (!c2.localitate.trim()) { toast.error(`Comparabila ${i + 1}: completati localitatea`); return false }
        if (!c2.suprafata || c2.suprafata <= 0) { toast.error(`Comparabila ${i + 1}: completati suprafata`); return false }
        if (!c2.pret_cerut || c2.pret_cerut <= 0) { toast.error(`Comparabila ${i + 1}: completati pretul`); return false }
      }
    }
    return true
  }

  const generate = async () => {
    if (!validateStep2()) return
    // Only send filled comparabile
    const filled = comparabile.filter((c, i) =>
      i === 0 || (c.judet && c.localitate.trim() && c.suprafata > 0 && c.pret_cerut > 0)
    )
    setLoading(true)
    try {
      const res = await fetch('/api/acp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subiect, comparabile: filled }),
      })
      if (!res.ok) throw new Error()
      setResult(await res.json())
      toast.success('Analiza generata!')
    } catch {
      toast.error('Eroare la generarea analizei')
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async () => {
    const filled = comparabile.filter((c, i) =>
      i === 0 || (c.judet && c.localitate.trim() && c.suprafata > 0 && c.pret_cerut > 0)
    )
    try {
      const res = await fetch('/api/acp/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subiect, comparabile: filled, result }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `ACP-${subiect.localitate || subiect.judet}.html`; a.click()
    } catch {
      toast.error('Eroare la export')
    }
  }

  const reset = () => {
    setResult(null); setStep(1)
    setSubiect(defaultSubiect())
    setComparabile([emptyComp()]); setExpanded([true])
  }

  // ── RESULT VIEW ─────────────────────────────────────────────────────────────
  if (result) {
    const filledComps = comparabile.filter((c, i) =>
      i === 0 || (c.judet && c.localitate.trim() && c.suprafata > 0 && c.pret_cerut > 0)
    )
    const avgPretMp = Math.round(
      filledComps.reduce((s, c) => s + c.pret_cerut / c.suprafata, 0) / filledComps.length
    )
    const subiectPretMp = subiect.suprafata > 0 ? Math.round(result.pret_recomandat / subiect.suprafata) : 0
    const dateRo = new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })

    return (
      <div className="max-w-4xl space-y-6">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Analiza noua
          </button>
          <button onClick={downloadPdf} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90" style={{ backgroundColor: NAVY }}>
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>

        {/* Professional report header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Logo left */}
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-hcp.png" alt="Home Capital Partners" style={{ height: 50, width: 'auto' }} />
            </div>
            {/* Title center */}
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: NAVY }}>Analiza Comparativa de Piata</p>
              <p className="text-xs text-slate-400 mt-0.5">{subiect.tip} · {locatie(subiect)}</p>
            </div>
            {/* Date right */}
            <div className="text-right">
              <p className="text-xs text-slate-400">Data raportului</p>
              <p className="text-sm font-semibold text-slate-700">{dateRo}</p>
            </div>
          </div>
          <div className="h-0.5" style={{ backgroundColor: NAVY }} />
        </div>

        {/* Summary box — navy */}
        <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: NAVY }}>
          <p className="text-blue-200 text-sm mb-1">Pret recomandat</p>
          <p className="text-4xl font-bold">{fmtEUR(result.pret_recomandat)}</p>
          <p className="text-blue-200 mt-2 text-sm">
            Interval: {fmtEUR(result.pret_recomandat_min)} — {fmtEUR(result.pret_recomandat_max)}
          </p>
          {subiect.pret_solicitat && (
            <p className="mt-3 text-sm bg-white/10 rounded-lg px-3 py-2 inline-block">
              Pret solicitat client: {fmtEUR(subiect.pret_solicitat)}
              {' — '}
              {subiect.pret_solicitat > result.pret_recomandat_max
                ? 'peste intervalul recomandat'
                : subiect.pret_solicitat < result.pret_recomandat_min
                ? 'sub intervalul recomandat'
                : 'in intervalul recomandat ✓'}
            </p>
          )}
          <p className="mt-3 text-blue-300 text-xs">Pret mediu/mp comparabile: {fmtEUR(avgPretMp)}/mp</p>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">Comparatie €/mp</h3>
            <BarChart
              subiect={{ label: locatieScurta(subiect) || 'Subiect', pretMp: subiectPretMp }}
              comps={filledComps.map(c => ({
                label: locatieScurta(c),
                pretMp: Math.round(c.pret_cerut / c.suprafata),
              }))}
            />
          </div>
          {/* Gauge */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-1 text-sm">Pozitionare pret</h3>
            <p className="text-xs text-slate-400 mb-2">Interval recomandat vs pret solicitat</p>
            <PriceGauge
              min={result.pret_recomandat_min}
              max={result.pret_recomandat_max}
              rec={result.pret_recomandat}
              clientPrice={subiect.pret_solicitat}
            />
          </div>
        </div>

        {/* Analysis */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Analiza</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{result.analiza}</p>
        </div>

        {/* Comparables table */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Comparabile ({filledComps.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Adresa / Zona</th>
                  <th className="pb-2 pr-3 font-medium">Sup.</th>
                  {showNrCamere(subiect.tip) && <th className="pb-2 pr-3 font-medium">Cam.</th>}
                  {showEtaj(subiect.tip) && <th className="pb-2 pr-3 font-medium">Etaj</th>}
                  {showStare(subiect.tip) && <th className="pb-2 pr-3 font-medium">Stare</th>}
                  <th className="pb-2 pr-3 font-medium">Pret cerut</th>
                  <th className="pb-2 pr-3 font-medium">€/mp</th>
                  <th className="pb-2 font-medium">Observatii AI</th>
                </tr>
              </thead>
              <tbody>
                {filledComps.map((c, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 pr-3 text-slate-400 font-medium">{i + 1}</td>
                    <td className="py-3 pr-3 font-medium text-slate-800">
                      {c.link_anunt
                        ? <a href={c.link_anunt} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{locatie(c)}</a>
                        : locatie(c)}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{c.suprafata} mp</td>
                    {showNrCamere(subiect.tip) && <td className="py-3 pr-3 text-slate-600">{c.nr_camere ?? '—'}</td>}
                    {showEtaj(subiect.tip) && <td className="py-3 pr-3 text-slate-600">{c.etaj || '—'}</td>}
                    {showStare(subiect.tip) && (
                      <td className="py-3 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.stare === 'Renovata' ? 'bg-green-100 text-green-700' :
                          c.stare === 'Stare buna' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>{c.stare}</span>
                      </td>
                    )}
                    <td className="py-3 pr-3 font-semibold text-slate-900">{fmtEUR(c.pret_cerut)}</td>
                    <td className="py-3 pr-3 text-slate-600">{fmtEUR(Math.round(c.pret_cerut / c.suprafata))}</td>
                    <td className="py-3 text-xs text-slate-500">{result.observatii_comparabile[i] ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ── FORM VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step === s ? 'bg-blue-900 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>{s}</div>
            <span className={`text-sm font-medium ${step === s ? 'text-slate-900' : 'text-slate-400'}`}>
              {s === 1 ? 'Proprietatea subiect' : 'Comparabile'}
            </span>
            {s < 2 && <div className="w-8 h-px bg-slate-200 ml-1" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1 ─────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-5">Detalii proprietate subiect</h2>

          {/* Type cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {TIP_CARDS.map(({ tip, icon: Icon, label }) => (
              <button
                key={tip}
                type="button"
                onClick={() => setTip(tip)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  subiect.tip === tip
                    ? 'border-blue-900 bg-blue-50 text-blue-900'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Location — always */}
            <div>
              <label className="label">Judet *</label>
              <select value={subiect.judet} onChange={e => updS('judet', e.target.value)} className="input-field">
                <option value="">— Selectati judetul —</option>
                {JUDETE.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Localitate *</label>
              {subiect.judet === 'Bucuresti' ? (
                <select value={subiect.localitate} onChange={e => updS('localitate', e.target.value)} className="input-field">
                  <option value="">— Sector —</option>
                  {SECTOARE.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input value={subiect.localitate} onChange={e => updS('localitate', e.target.value)} className="input-field" placeholder="ex: Cluj-Napoca, Floresti" />
              )}
            </div>
            <div>
              <label className="label">Adresa <span className="text-slate-400 font-normal">— optional</span></label>
              <input value={subiect.adresa_stradala || ''} onChange={e => updS('adresa_stradala', e.target.value)} className="input-field" placeholder="ex: Str. Unirii 10" />
            </div>

            {/* APARTAMENT fields */}
            {subiect.tip === 'Apartament' && (<>
              <div>
                <label className="label">Suprafata (mp) *</label>
                <input type="number" value={subiect.suprafata || ''} onChange={e => updS('suprafata', Number(e.target.value))} className="input-field" placeholder="ex: 75" min={1} />
              </div>
              <div>
                <label className="label">Nr camere</label>
                <input type="number" value={subiect.nr_camere || ''} onChange={e => updS('nr_camere', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 3" min={1} max={20} />
              </div>
              <div>
                <label className="label">Etaj</label>
                <input value={subiect.etaj || ''} onChange={e => updS('etaj', e.target.value)} className="input-field" placeholder="ex: 3, parter, mansarda" />
              </div>
              <div>
                <label className="label">An constructie</label>
                <input type="number" value={subiect.an_constructie || ''} onChange={e => updS('an_constructie', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 2010" min={1900} max={2030} />
              </div>
              <div>
                <label className="label">Stare</label>
                <select value={subiect.stare ?? 'Stare buna'} onChange={e => updS('stare', e.target.value)} className="input-field">
                  {STARI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>)}

            {/* CASA/VILA fields */}
            {subiect.tip === 'Casa/Vila' && (<>
              <div>
                <label className="label">Suprafata utila (mp) *</label>
                <input type="number" value={subiect.suprafata || ''} onChange={e => updS('suprafata', Number(e.target.value))} className="input-field" placeholder="ex: 150" min={1} />
              </div>
              <div>
                <label className="label">Suprafata teren (mp)</label>
                <input type="number" value={subiect.suprafata_teren || ''} onChange={e => updS('suprafata_teren', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 400" min={1} />
              </div>
              <div>
                <label className="label">Nr camere</label>
                <input type="number" value={subiect.nr_camere || ''} onChange={e => updS('nr_camere', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 5" min={1} max={30} />
              </div>
              <div>
                <label className="label">Nr etaje</label>
                <input type="number" value={subiect.nr_etaje || ''} onChange={e => updS('nr_etaje', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 2" min={0} max={10} />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={subiect.mansarda ?? false} onChange={e => updS('mansarda', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800" />
                  <span className="text-sm text-slate-700">Mansarda</span>
                </label>
              </div>
              <div>
                <label className="label">An constructie</label>
                <input type="number" value={subiect.an_constructie || ''} onChange={e => updS('an_constructie', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 2005" min={1900} max={2030} />
              </div>
              <div>
                <label className="label">Stare</label>
                <select value={subiect.stare ?? 'Stare buna'} onChange={e => updS('stare', e.target.value)} className="input-field">
                  {STARI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="label">Utilitati disponibile</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {UTILITATI_CASA.map(u => (
                    <label key={u} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(subiect.utilitati ?? []).includes(u)} onChange={() => toggleUtilitate(u)} className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800" />
                      <span className="text-sm text-slate-700">{u}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>)}

            {/* TEREN fields */}
            {subiect.tip === 'Teren' && (<>
              <div>
                <label className="label">Suprafata (mp) *</label>
                <input type="number" value={subiect.suprafata || ''} onChange={e => updS('suprafata', Number(e.target.value))} className="input-field" placeholder="ex: 1000" min={1} />
              </div>
              <div>
                <label className="label">Deschidere la strada (m)</label>
                <input type="number" value={subiect.deschidere_strada || ''} onChange={e => updS('deschidere_strada', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 20" min={1} />
              </div>
              <div>
                <label className="label">Clasificare</label>
                <select value={subiect.clasificare ?? ''} onChange={e => updS('clasificare', e.target.value || undefined)} className="input-field">
                  <option value="">—</option>
                  <option value="Intravilan">Intravilan</option>
                  <option value="Extravilan">Extravilan</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="label">Utilitati disponibile</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {UTILITATI_TEREN.map(u => (
                    <label key={u} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(subiect.utilitati ?? []).includes(u)} onChange={() => toggleUtilitate(u)} className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800" />
                      <span className="text-sm text-slate-700">{u}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>)}

            {/* SPATIU COMERCIAL fields */}
            {subiect.tip === 'Spatiu Comercial' && (<>
              <div>
                <label className="label">Suprafata (mp) *</label>
                <input type="number" value={subiect.suprafata || ''} onChange={e => updS('suprafata', Number(e.target.value))} className="input-field" placeholder="ex: 120" min={1} />
              </div>
              <div>
                <label className="label">Etaj</label>
                <input value={subiect.etaj || ''} onChange={e => updS('etaj', e.target.value)} className="input-field" placeholder="ex: parter, 1, subsol" />
              </div>
              <div>
                <label className="label">An constructie</label>
                <input type="number" value={subiect.an_constructie || ''} onChange={e => updS('an_constructie', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 2015" min={1900} max={2030} />
              </div>
              <div>
                <label className="label">Stare</label>
                <select value={subiect.stare ?? 'Stare buna'} onChange={e => updS('stare', e.target.value)} className="input-field">
                  {STARI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>)}

            {/* Price — always */}
            <div>
              <label className="label">Pret solicitat de client (€) <span className="text-slate-400 font-normal">— optional</span></label>
              <input type="number" value={subiect.pret_solicitat || ''} onChange={e => updS('pret_solicitat', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 95000" min={1} />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={() => { if (validateStep1()) setStep(2) }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold">
              Continuă <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ─────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Proprietati comparabile</h2>
            <p className="text-xs text-slate-400 mb-5">Prima comparabila este obligatorie. Puteti adauga pana la 5.</p>

            <div className="space-y-2">
              {comparabile.map((c, i) => {
                const isOpen = expanded[i]
                const hasData = c.judet || c.localitate.trim() || c.suprafata > 0 || c.pret_cerut > 0
                const pretMp = c.suprafata > 0 && c.pret_cerut > 0
                  ? fmtEUR(Math.round(c.pret_cerut / c.suprafata)) + '/mp'
                  : null

                return (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Accordion header */}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(i)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {c.localitate.trim() ? locatie(c) : `Comparabila ${i + 1}`}
                        </span>
                        {pretMp && !isOpen && (
                          <span className="text-xs text-slate-400 font-normal">{fmtEUR(c.pret_cerut)} · {pretMp}</span>
                        )}
                        {i > 0 && !hasData && <span className="text-xs text-slate-300">optional</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {i > 0 && (
                          <span
                            role="button"
                            onClick={e => { e.stopPropagation(); removeComp(i) }}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {/* Accordion body */}
                    {isOpen && (
                      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="label">Judet {i === 0 ? '*' : ''}</label>
                          <select value={c.judet} onChange={e => updC(i, 'judet', e.target.value)} className="input-field">
                            <option value="">— Judet —</option>
                            {JUDETE.map(j => <option key={j} value={j}>{j}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Localitate {i === 0 ? '*' : ''}</label>
                          {c.judet === 'Bucuresti' ? (
                            <select value={c.localitate} onChange={e => updC(i, 'localitate', e.target.value)} className="input-field">
                              <option value="">— Sector —</option>
                              {SECTOARE.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <input value={c.localitate} onChange={e => updC(i, 'localitate', e.target.value)} className="input-field" placeholder="ex: Cluj-Napoca" />
                          )}
                        </div>
                        <div>
                          <label className="label">Adresa <span className="text-slate-400 font-normal">— opt.</span></label>
                          <input value={c.adresa_stradala || ''} onChange={e => updC(i, 'adresa_stradala', e.target.value)} className="input-field" placeholder="ex: Str. Unirii 10" />
                        </div>
                        <div>
                          <label className="label">Suprafata (mp) {i === 0 ? '*' : ''}</label>
                          <input type="number" value={c.suprafata || ''} onChange={e => updC(i, 'suprafata', Number(e.target.value))} className="input-field" placeholder="ex: 72" min={1} />
                        </div>
                        {showNrCamere(subiect.tip) && (
                          <div>
                            <label className="label">Nr camere</label>
                            <input type="number" value={c.nr_camere || ''} onChange={e => updC(i, 'nr_camere', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 3" min={1} />
                          </div>
                        )}
                        {showEtaj(subiect.tip) && (
                          <div>
                            <label className="label">Etaj</label>
                            <input value={c.etaj || ''} onChange={e => updC(i, 'etaj', e.target.value)} className="input-field" placeholder="ex: 2" />
                          </div>
                        )}
                        {showStare(subiect.tip) && (
                          <div>
                            <label className="label">Stare</label>
                            <select value={c.stare ?? 'Stare buna'} onChange={e => updC(i, 'stare', e.target.value)} className="input-field">
                              {STARI.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="label">Pret cerut (€) {i === 0 ? '*' : ''}</label>
                          <input type="number" value={c.pret_cerut || ''} onChange={e => updC(i, 'pret_cerut', Number(e.target.value))} className="input-field" placeholder="ex: 85000" min={1} />
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <label className="label">Link anunt <span className="text-slate-400 font-normal">— optional, doar referinta</span></label>
                          <input value={c.link_anunt || ''} onChange={e => updC(i, 'link_anunt', e.target.value)} className="input-field" placeholder="https://..." />
                        </div>
                        {pretMp && (
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-xs text-slate-400">Pret/mp calculat: <span className="font-semibold text-slate-600">{pretMp}</span></p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add button */}
              {comparabile.length < 5 && (
                <button
                  type="button"
                  onClick={addComp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-900 rounded-xl transition-colors text-sm font-semibold"
                >
                  <Plus className="w-4 h-4 text-blue-900" /> Adauga comparabila {comparabile.length + 1}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-4 h-4" /> Inapoi
            </button>
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-xl font-semibold"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Se genereaza...</>
                : <><Sparkles className="w-5 h-5" /> Genereaza Analiza</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
