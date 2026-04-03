import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Home, Plus, UserPlus } from 'lucide-react'
import { DealRoom } from '@/types'
import { DEALROOM_STATUS_LABELS, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  activ:            'bg-green-100 text-green-700',
  oferta_acceptata: 'bg-amber-100 text-amber-700',
  inchis:           'bg-gray-100 text-gray-500',
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default async function DealRoomListPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select('*')
    .eq('agent_id', user?.id)
    .order('created_at', { ascending: false })

  const list = (dealrooms ?? []) as DealRoom[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">DealRoom</h1>
          <p className="text-slate-500 mt-1">
            {list.length} proprietat{list.length !== 1 ? 'i' : 'e'}
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Niciun DealRoom activ</h3>
          <p className="text-slate-500 mb-6">
            DealRoom-urile se creeaza automat dupa semnarea unui contract
          </p>
          <Link
            href="/contracte/nou"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Contract nou
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((dr) => {
            const title = [capitalize(dr.tip_proprietate ?? 'Proprietate'), dr.adresa_scurta]
              .filter(Boolean)
              .join(' - ')

            return (
              <div
                key={dr.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Header */}
                <Link
                  href={`/dealroom/${dr.id}`}
                  className="block p-6 hover:bg-slate-50 transition-colors flex-1"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-base font-semibold text-slate-900 leading-snug">
                      {title}
                    </h3>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[dr.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {DEALROOM_STATUS_LABELS[dr.status] ?? dr.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{formatDate(dr.created_at)}</p>
                </Link>

                {/* Footer */}
                <div className="px-6 pb-5">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Adaugă vizitator
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
