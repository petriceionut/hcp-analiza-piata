'use client'

import { useState } from 'react'
import type { ACPSubiect, ACPComparabila, ACPAnalysisResult, ACPStare, ACPTip } from '@/types'
import { Loader2, Plus, Trash2, ArrowLeft, ArrowRight, Sparkles, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const STARI: ACPStare[] = ['Renovata', 'Stare buna', 'Necesita renovare']
const TIPURI: ACPTip[] = ['Apartament', 'Casa', 'Teren', 'Spatiu comercial']

const emptyComp = (): ACPComparabila => ({
  adresa: '', suprafata: 0, nr_camere: undefined, etaj: '',
  stare: 'Stare buna', pret_cerut: 0, link_anunt: '',
})

function fmt(n: number) {
  return new Intl.NumberFormat('ro-RO').format(n) + ' RON'
}

export default function ACPClient() {
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ACPAnalysisResult | null>(null)

  const [subiect, setSubiect] = useState<ACPSubiect>({
    tip: 'Apartament', adresa: '', suprafata: 0,
    nr_camere: undefined, etaj: '', an_constructie: undefined,
    stare: 'Stare buna', pret_solicitat: undefined,
  })

  const [comparabile, setComparabile] = useState<ACPComparabila[]>([
    emptyComp(), emptyComp(), emptyComp(),
  ])

  const updS = (k: keyof ACPSubiect, v: unknown) =>
    setSubiect(p => ({ ...p, [k]: v }))

  const updC = (i: number, k: keyof ACPComparabila, v: unknown) =>
    setComparabile(p => p.map((c, idx) => idx === i ? { ...c, [k]: v } : c))

  const addComp = () => {
    if (comparabile.length >= 5) return
    setComparabile(p => [...p, emptyComp()])
  }

  const removeComp = (i: number) => {
    if (comparabile.length <= 3) { toast.error('Minimum 3 comparabile'); return }
    setComparabile(p => p.filter((_, idx) => idx !== i))
  }

  const validateStep1 = () => {
    if (!subiect.adresa.trim()) { toast.error('Completati adresa proprietatii subiect'); return false }
    if (!subiect.suprafata || subiect.suprafata <= 0) { toast.error('Completati suprafata'); return false }
    return true
  }

  const validateStep2 = () => {
    for (let i = 0; i < comparabile.length; i++) {
      const c = comparabile[i]
      if (!c.adresa.trim()) { toast.error(`Comparabila ${i + 1}: completati adresa`); return false }
      if (!c.suprafata || c.suprafata <= 0) { toast.error(`Comparabila ${i + 1}: completati suprafata`); return false }
      if (!c.pret_cerut || c.pret_cerut <= 0) { toast.error(`Comparabila ${i + 1}: completati pretul`); return false }
    }
    return true
  }

  const generate = async () => {
    if (!validateStep2()) return
    setLoading(true)
    try {
      const res = await fetch('/api/acp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subiect, comparabile }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data)
      toast.success('Analiza generata!')
    } catch {
      toast.error('Eroare la generarea analizei')
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async () => {
    try {
      const res = await fetch('/api/acp/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subiect, comparabile, result }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ACP-${subiect.adresa.slice(0, 20)}.html`
      a.click()
    } catch {
      toast.error('Eroare la export')
    }
  }

  const reset = () => {
    setResult(null)
    setStep(1)
    setSubiect({ tip: 'Apartament', adresa: '', suprafata: 0, nr_camere: undefined, etaj: '', an_constructie: undefined, stare: 'Stare buna', pret_solicitat: undefined })
    setComparabile([emptyComp(), emptyComp(), emptyComp()])
  }

  if (result) {
    const avgPretMp = Math.round(
      comparabile.reduce((s, c) => s + c.pret_cerut / c.suprafata, 0) / comparabile.length
    )
    return (
      <div className="max-w-4xl space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Analiza noua
          </button>
          <button onClick={downloadPdf} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>

        {/* Price box */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
          <p className="text-purple-200 text-sm mb-1">Pret recomandat</p>
          <p className="text-4xl font-bold">{fmt(result.pret_recomandat)}</p>
          <p className="text-purple-200 mt-2 text-sm">
            Interval: {fmt(result.pret_recomandat_min)} — {fmt(result.pret_recomandat_max)}
          </p>
          {subiect.pret_solicitat && (
            <p className="mt-3 text-sm bg-white/10 rounded-lg px-3 py-2 inline-block">
              Pret solicitat client: {fmt(subiect.pret_solicitat)}
              {' '}
              {subiect.pret_solicitat > result.pret_recomandat_max
                ? '— peste intervalul recomandat'
                : subiect.pret_solicitat < result.pret_recomandat_min
                ? '— sub intervalul recomandat'
                : '— in intervalul recomandat ✓'}
            </p>
          )}
          <p className="mt-3 text-purple-300 text-xs">Pret mediu/mp comparabile: {fmt(avgPretMp)}/mp</p>
        </div>

        {/* Analysis */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Analiza</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{result.analiza}</p>
        </div>

        {/* Comparables table */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Comparabile ({comparabile.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="pb-2 pr-4 font-medium">#</th>
                  <th className="pb-2 pr-4 font-medium">Adresa / Zona</th>
                  <th className="pb-2 pr-4 font-medium">Sup.</th>
                  <th className="pb-2 pr-4 font-medium">Cam.</th>
                  <th className="pb-2 pr-4 font-medium">Etaj</th>
                  <th className="pb-2 pr-4 font-medium">Stare</th>
                  <th className="pb-2 pr-4 font-medium">Pret cerut</th>
                  <th className="pb-2 pr-4 font-medium">Pret/mp</th>
                  <th className="pb-2 font-medium">Observatii AI</th>
                </tr>
              </thead>
              <tbody>
                {comparabile.map((c, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 pr-4 text-slate-400 font-medium">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {c.link_anunt
                        ? <a href={c.link_anunt} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{c.adresa}</a>
                        : c.adresa}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{c.suprafata} mp</td>
                    <td className="py-3 pr-4 text-slate-600">{c.nr_camere ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-600">{c.etaj || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.stare === 'Renovata' ? 'bg-green-100 text-green-700' :
                        c.stare === 'Stare buna' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{c.stare}</span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-900">{fmt(c.pret_cerut)}</td>
                    <td className="py-3 pr-4 text-slate-600">{fmt(Math.round(c.pret_cerut / c.suprafata))}/mp</td>
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

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-5">Detalii proprietate subiect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Tip proprietate</label>
              <select value={subiect.tip} onChange={e => updS('tip', e.target.value)} className="input-field">
                {TIPURI.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Adresa / Zona *</label>
              <input value={subiect.adresa} onChange={e => updS('adresa', e.target.value)} className="input-field" placeholder="ex: Floreasca, Sector 2, Bucuresti" />
            </div>
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
              <select value={subiect.stare} onChange={e => updS('stare', e.target.value)} className="input-field">
                {STARI.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pret solicitat de client (RON) <span className="text-slate-400 font-normal">— optional</span></label>
              <input type="number" value={subiect.pret_solicitat || ''} onChange={e => updS('pret_solicitat', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 180000" min={1} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => { if (validateStep1()) setStep(2) }}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold"
            >
              Continuă <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-slate-900">Proprietati comparabile</h2>
                <p className="text-xs text-slate-400 mt-0.5">Minimum 3, maximum 5 comparabile</p>
              </div>
              {comparabile.length < 5 && (
                <button onClick={addComp} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">
                  <Plus className="w-4 h-4" /> Adauga comparabila
                </button>
              )}
            </div>

            <div className="space-y-5">
              {comparabile.map((c, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">Comparabila {i + 1}</span>
                    {comparabile.length > 3 && (
                      <button onClick={() => removeComp(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                      <label className="label">Adresa / Zona *</label>
                      <input value={c.adresa} onChange={e => updC(i, 'adresa', e.target.value)} className="input-field" placeholder="ex: Floreasca, Sector 2" />
                    </div>
                    <div>
                      <label className="label">Suprafata (mp) *</label>
                      <input type="number" value={c.suprafata || ''} onChange={e => updC(i, 'suprafata', Number(e.target.value))} className="input-field" placeholder="ex: 72" min={1} />
                    </div>
                    <div>
                      <label className="label">Nr camere</label>
                      <input type="number" value={c.nr_camere || ''} onChange={e => updC(i, 'nr_camere', e.target.value ? Number(e.target.value) : undefined)} className="input-field" placeholder="ex: 3" min={1} />
                    </div>
                    <div>
                      <label className="label">Etaj</label>
                      <input value={c.etaj || ''} onChange={e => updC(i, 'etaj', e.target.value)} className="input-field" placeholder="ex: 2" />
                    </div>
                    <div>
                      <label className="label">Stare</label>
                      <select value={c.stare} onChange={e => updC(i, 'stare', e.target.value)} className="input-field">
                        {STARI.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Pret cerut (RON) *</label>
                      <input type="number" value={c.pret_cerut || ''} onChange={e => updC(i, 'pret_cerut', Number(e.target.value))} className="input-field" placeholder="ex: 175000" min={1} />
                    </div>
                    <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                      <label className="label">Link anunt <span className="text-slate-400 font-normal">— optional</span></label>
                      <input value={c.link_anunt || ''} onChange={e => updC(i, 'link_anunt', e.target.value)} className="input-field" placeholder="https://..." />
                    </div>
                    {c.suprafata > 0 && c.pret_cerut > 0 && (
                      <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                        <p className="text-xs text-slate-400">
                          Pret/mp calculat: <span className="font-semibold text-slate-600">{fmt(Math.round(c.pret_cerut / c.suprafata))}/mp</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-4 h-4" /> Inapoi
            </button>
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-semibold"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Se genereaza...</> : <><Sparkles className="w-5 h-5" /> Genereaza Analiza</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
