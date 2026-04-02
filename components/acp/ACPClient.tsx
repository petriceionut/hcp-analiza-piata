'use client'

import { useState } from 'react'
import { ACPRequest, ACPResult, PropertyType } from '@/types'
import { PROPERTY_TYPES } from '@/lib/utils'
import {
  TrendingUp,
  Loader2,
  Download,
  BarChart3,
  Layers,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import ACPReport from './ACPReport'

const JUDETE = [
  'Alba', 'Arad', 'Arges', 'Bacau', 'Bihor', 'Bistrita-Nasaud', 'Botosani', 'Brasov',
  'Braila', 'Buzau', 'Caras-Severin', 'Calarasi', 'Cluj', 'Constanta', 'Covasna',
  'Dambovita', 'Dolj', 'Galati', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara', 'Ialomita',
  'Iasi', 'Ilfov', 'Maramures', 'Mehedinti', 'Mures', 'Neamt', 'Olt', 'Prahova',
  'Satu Mare', 'Salaj', 'Sibiu', 'Suceava', 'Teleorman', 'Timis', 'Tulcea', 'Vaslui',
  'Valcea', 'Vrancea', 'Bucuresti',
]

export default function ACPClient() {
  const [mode, setMode] = useState<'form' | 'text'>('form')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ACPResult | null>(null)
  const [textQuery, setTextQuery] = useState('')

  const [formData, setFormData] = useState<ACPRequest>({
    tip_proprietate: 'apartament',
    judet: 'Ilfov',
    localitate: '',
    suprafata_mp: 0,
    nr_camere: undefined,
    an_constructie: undefined,
    etaj: '',
    observatii: '',
  })

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.localitate || !formData.suprafata_mp) {
      toast.error('Completeaza localitate si suprafata')
      return
    }
    await runAnalysis({ mode: 'form', data: formData })
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textQuery.trim()) {
      toast.error('Introduceti o cerere de analiza')
      return
    }
    await runAnalysis({ mode: 'text', query: textQuery })
  }

  const runAnalysis = async (payload: { mode: 'form'; data: ACPRequest } | { mode: 'text'; query: string }) => {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/acp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      setResult(data)
      toast.success('Analiza generata cu succes!')
    } catch {
      toast.error('Eroare la generarea analizei')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: keyof ACPRequest, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-5xl">
      {!result ? (
        <div className="space-y-6">
          {/* Mode toggle */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setMode('form')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'form' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Campuri structurate
              </button>
              <button
                onClick={() => setMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'text' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Cerere in text
              </button>
            </div>

            {mode === 'form' ? (
              <form onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="label">Tip proprietate</label>
                    <select value={formData.tip_proprietate} onChange={(e) => update('tip_proprietate', e.target.value)} className="input-field">
                      {(Object.keys(PROPERTY_TYPES) as PropertyType[]).map((t) => (
                        <option key={t} value={t}>{PROPERTY_TYPES[t]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Judet</label>
                    <select value={formData.judet} onChange={(e) => update('judet', e.target.value)} className="input-field">
                      {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label">Localitate / Zona *</label>
                    <input value={formData.localitate} onChange={(e) => update('localitate', e.target.value)} className="input-field" placeholder="ex: Voluntari, Pipera, Baneasa" required />
                  </div>

                  <div>
                    <label className="label">Suprafata (mp) *</label>
                    <input type="number" value={formData.suprafata_mp || ''} onChange={(e) => update('suprafata_mp', Number(e.target.value))} className="input-field" placeholder="ex: 75" required min={1} />
                  </div>

                  {(formData.tip_proprietate === 'apartament' || formData.tip_proprietate === 'casa') && (
                    <div>
                      <label className="label">Nr. camere</label>
                      <input type="number" value={formData.nr_camere || ''} onChange={(e) => update('nr_camere', Number(e.target.value))} className="input-field" placeholder="ex: 3" min={1} max={20} />
                    </div>
                  )}

                  <div>
                    <label className="label">An constructie</label>
                    <input type="number" value={formData.an_constructie || ''} onChange={(e) => update('an_constructie', Number(e.target.value))} className="input-field" placeholder="ex: 2010" min={1900} max={new Date().getFullYear()} />
                  </div>

                  {formData.tip_proprietate === 'apartament' && (
                    <div>
                      <label className="label">Etaj</label>
                      <input value={formData.etaj || ''} onChange={(e) => update('etaj', e.target.value)} className="input-field" placeholder="ex: 3, parter, mansarda" />
                    </div>
                  )}

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="label">Observatii / caracteristici speciale</label>
                    <textarea value={formData.observatii || ''} onChange={(e) => update('observatii', e.target.value)} className="input-field resize-none" rows={2} placeholder="ex: vedere la parc, parcare subterana, renovat recent..." />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-semibold transition-colors">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Se analizeaza piata...</> : <><Sparkles className="w-5 h-5" />Genereaza analiza</>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleTextSubmit}>
                <div className="mb-4">
                  <label className="label">Descriere proprietate (text liber)</label>
                  <textarea value={textQuery} onChange={(e) => setTextQuery(e.target.value)} className="input-field resize-none" rows={5}
                    placeholder="Ex: Vreau o analiza comparativa pentru un apartament de 3 camere in Voluntari, zona Pipera, 75 mp, etaj 3, construit in 2018..." required />
                </div>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-semibold transition-colors">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Se analizeaza...</> : <><Sparkles className="w-5 h-5" />Analizeaza</>}
                </button>
              </form>
            )}
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: BarChart3, title: 'Analiza comparativa', desc: 'Comparatie cu proprietati similare din zona' },
              { icon: TrendingUp, title: 'Tendinte piata', desc: 'Evolutia preturilor in ultimele luni' },
              { icon: Download, title: 'Export PDF', desc: 'Raport profesional pentru clienti' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-white rounded-xl border border-gray-100 p-4">
                  <Icon className="w-5 h-5 text-purple-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-900 mb-1">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <ACPReport
          result={result}
          request={mode === 'form' ? formData : undefined}
          textQuery={mode === 'text' ? textQuery : undefined}
          onReset={() => setResult(null)}
        />
      )}
    </div>
  )
}
