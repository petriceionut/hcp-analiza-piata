'use client'

import { ACPRequest, ACPResult } from '@/types'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  BarChart3,
  MapPin,
  Euro,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  result: ACPResult
  request?: ACPRequest
  textQuery?: string
  onReset: () => void
}

export default function ACPReport({ result, request, textQuery, onReset }: Props) {
  const handleDownloadPDF = async () => {
    try {
      const res = await fetch('/api/acp/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, request, textQuery }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analiza-piata-${Date.now()}.html`
      a.click()
    } catch {
      toast.error('Eroare la generarea raportului')
    }
  }

  const avgPrice = result.pret_mediu
  const recPrice = result.recomandare_pret
  const diff = ((recPrice - avgPrice) / avgPrice) * 100

  return (
    <div className="space-y-6 fade-in">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <button onClick={onReset} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Analiza noua
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors">
          <Download className="w-4 h-4" />
          Descarca PDF
        </button>
      </div>

      {/* Price overview */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-purple-200 text-sm mb-1">Pret recomandat</p>
            <p className="text-4xl font-bold">{formatCurrency(result.recomandare_pret)}</p>
            <div className="flex items-center gap-1.5 mt-2">
              {diff > 2 ? (
                <TrendingUp className="w-4 h-4 text-green-300" />
              ) : diff < -2 ? (
                <TrendingDown className="w-4 h-4 text-red-300" />
              ) : (
                <Minus className="w-4 h-4 text-yellow-300" />
              )}
              <span className={`text-sm font-medium ${diff > 2 ? 'text-green-300' : diff < -2 ? 'text-red-300' : 'text-yellow-300'}`}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}% fata de media pietei
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-xs mb-1">Pret/mp</p>
            <p className="text-2xl font-bold">{formatCurrency(Math.round(result.pret_mp_mediu))}</p>
            <p className="text-purple-200 text-xs">/mp</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-purple-200 mb-1">Minim</p>
            <p className="text-lg font-bold">{formatCurrency(result.pret_minim)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-purple-200 mb-1">Median</p>
            <p className="text-lg font-bold">{formatCurrency(result.pret_median)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-purple-200 mb-1">Maxim</p>
            <p className="text-lg font-bold">{formatCurrency(result.pret_maxim)}</p>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-900">Analiza AI</h3>
        </div>
        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
          {result.analiza_text}
        </div>
      </div>

      {/* Factors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-slate-900">Factori pozitivi</h3>
          </div>
          <ul className="space-y-2">
            {result.factori_pozitivi.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-green-500 mt-0.5">+</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-slate-900">Factori negativi / riscuri</h3>
          </div>
          <ul className="space-y-2">
            {result.factori_negativi.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-red-500 mt-0.5">-</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Comparable properties */}
      {result.proprietati_comparabile.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-900">Proprietati comparabile</h3>
          </div>
          <div className="space-y-3">
            {result.proprietati_comparabile.map((prop, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{prop.adresa}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    <span>{prop.suprafata} mp</span>
                    {prop.nr_camere && <span>{prop.nr_camere} camere</span>}
                    {prop.an_constructie && <span>{prop.an_constructie}</span>}
                    <span>{prop.sursa}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(prop.pret)}</p>
                  <p className="text-xs text-slate-400">{formatCurrency(prop.pret_mp)}/mp</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
