'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ACPRaport {
  id: string
  created_at: string
  nume_proprietar: string | null
  telefon_proprietar: string | null
  tip_proprietate: string | null
  judet: string | null
  localitate: string | null
  adresa: string | null
  pret_recomandat: number | null
}

function fmtEUR(n: number) {
  return '€' + new Intl.NumberFormat('ro-RO').format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ACPSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ACPRaport[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const q = query.trim()
        const { data } = await supabase
          .from('acp_rapoarte')
          .select('id,created_at,nume_proprietar,telefon_proprietar,tip_proprietate,judet,localitate,adresa,pret_recomandat')
          .or(`nume_proprietar.ilike.%${q}%,telefon_proprietar.ilike.%${q}%,localitate.ilike.%${q}%,adresa.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(8)
        setResults(data ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  return (
    <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-slate-700">Cauta raport ACP</h3>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cauta dupa nume, telefon sau adresa..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => router.push(`/acp/raport/${r.id}`)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-colors text-left group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                    {r.tip_proprietate}
                  </span>
                  <span className="text-xs text-slate-400">{fmtDate(r.created_at)}</span>
                </div>
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {r.nume_proprietar || 'Proprietar necunoscut'}
                  {r.telefon_proprietar && (
                    <span className="text-slate-400 font-normal ml-2">{r.telefon_proprietar}</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {[r.adresa, r.localitate, r.judet].filter(Boolean).join(', ')}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {r.pret_recomandat && (
                  <span className="text-sm font-bold text-slate-900">{fmtEUR(r.pret_recomandat)}</span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {query.trim() && !loading && results.length === 0 && (
        <p className="mt-3 text-sm text-slate-400 text-center py-2">
          Niciun raport gasit pentru &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  )
}
