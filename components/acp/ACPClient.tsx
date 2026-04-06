'use client'

import { useState } from 'react'
import type { ACPSubiect, ACPComparabila, ACPAnalysisResult, ACPStare, ACPTip } from '@/types'
import {
  Loader2, Plus, X, ArrowLeft, ArrowRight, Sparkles, Download,
  Building2, Home, Landmark, Store, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STARI: ACPStare[] = ['Renovata', 'Stare buna', 'Necesita renovare']

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

const emptyComp = (): ACPComparabila => ({
  adresa: '', suprafata: 0, nr_camere: undefined, etaj: '',
  stare: 'Stare buna', pret_cerut: 0, link_anunt: '',
})

const defaultSubiect = (): ACPSubiect => ({
  tip: 'Apartament', adresa: '', suprafata: 0, stare: 'Stare buna',
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
    if (!subiect.adresa.trim()) { toast.error('Completati adresa proprietatii subiect'); return false }
    if (!subiect.suprafata || subiect.suprafata <= 0) { toast.error('Completati suprafata'); return false }
    return true
  }

  const validateStep2 = () => {
    const c = comparabile[0]
    if (!c.adresa.trim()) { toast.error('Comparabila 1: completati adresa'); return false }
    if (!c.suprafata || c.suprafata <= 0) { toast.error('Comparabila 1: completati suprafata'); return false }
    if (!c.pret_cerut || c.pret_cerut <= 0) { toast.error('Comparabila 1: completati pretul'); return false }
    // validate any additional comp that has partial data
    for (let i = 1; i < comparabile.length; i++) {
      const c2 = comparabile[i]
      const hasAny = c2.adresa || c2.suprafata || c2.pret_cerut
      if (hasAny) {
        if (!c2.adresa.trim()) { toast.error(`Comparabila ${i + 1}: completati adresa`); return false }
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
      i === 0 || (c.adresa.trim() && c.suprafata > 0 && c.pret_cerut > 0)
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
      i === 0 || (c.adresa.trim() && c.suprafata > 0 && c.pret_cerut > 0)
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
      a.href = url; a.download = `ACP-${subiect.adresa.slice(0, 20)}.html`; a.click()
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
      i === 0 || (c.adresa.trim() && c.suprafata > 0 && c.pret_cerut > 0)
    )
    const avgPretMp = Math.round(
      filledComps.reduce((s, c) => s + c.pret_cerut / c.suprafata, 0) / filledComps.length
    )
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Analiza noua
          </button>
          <button onClick={downloadPdf} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
          <p className="text-purple-200 text-sm mb-1">Pret recomandat</p>
          <p className="text-4xl font-bold">{fmtEUR(result.pret_recomandat)}</p>
          <p className="text-purple-200 mt-2 text-sm">
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
          <p className="mt-3 text-purple-300 text-xs">Pret mediu/mp comparabile: {fmtEUR(avgPretMp)}/mp</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Analiza</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{result.analiza}</p>
        </div>

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
                        ? <a href={c.link_anunt} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{c.adresa}</a>
                        : c.adresa}
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
              step === s ? 'bg-purple-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
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
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Address — always */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">Adresa / Zona *</label>
              <input value={subiect.adresa} onChange={e => updS('adresa', e.target.value)} className="input-field" placeholder="ex: Floreasca, Sector 2, Bucuresti" />
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
                  <input type="checkbox" checked={subiect.mansarda ?? false} onChange={e => updS('mansarda', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
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
                      <input type="checkbox" checked={(subiect.utilitati ?? []).includes(u)} onChange={() => toggleUtilitate(u)} className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
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
                      <input type="checkbox" checked={(subiect.utilitati ?? []).includes(u)} onChange={() => toggleUtilitate(u)} className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
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
            <button onClick={() => { if (validateStep1()) setStep(2) }} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold">
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
                const hasData = c.adresa.trim() || c.suprafata > 0 || c.pret_cerut > 0
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
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {c.adresa.trim() || `Comparabila ${i + 1}`}
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
                        <div className="col-span-2">
                          <label className="label">Adresa / Zona {i === 0 ? '*' : ''}</label>
                          <input value={c.adresa} onChange={e => updC(i, 'adresa', e.target.value)} className="input-field" placeholder="ex: Floreasca, Sector 2" />
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 text-purple-700 rounded-xl transition-colors text-sm font-semibold"
                >
                  <Plus className="w-4 h-4 text-purple-600" /> Adauga comparabila {comparabile.length + 1}
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
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-semibold"
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
