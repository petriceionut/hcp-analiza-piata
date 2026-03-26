import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Home, Plus } from 'lucide-react'
import { DealRoom, PropertyType } from '@/types'
import { PROPERTY_ICONS, PROPERTY_TYPES, DEALROOM_STATUS_LABELS, formatDate } from '@/lib/utils'

export default async function DealRoomListPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select(`
      *,
      cumparatori:buyers(count),
      oferte:offers(count)
    `)
    .eq('agent_id', user?.id)
    .order('created_at', { ascending: false })

  const list = (dealrooms ?? []) as (DealRoom & {
    cumparatori: [{ count: number }]
    oferte: [{ count: number }]
  })[]

  const statusColors: Record<string, string> = {
    activ: 'bg-green-100 text-green-700',
    oferta_acceptata: 'bg-amber-100 text-amber-700',
    inchis: 'bg-gray-100 text-gray-500',
  }

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
            const propertyType = dr.tip_proprietate as PropertyType
            const icon = PROPERTY_ICONS[propertyType]
            const buyerCount = dr.cumparatori?.[0]?.count ?? 0
            const offerCount = dr.oferte?.[0]?.count ?? 0

            return (
              <Link
                key={dr.id}
                href={`/dealroom/${dr.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all overflow-hidden group"
              >
                {/* Icon */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 flex items-center justify-center">
                  <span className="text-5xl">{icon}</span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                      {PROPERTY_TYPES[propertyType]}
                    </h3>
                    <span className={`badge ${statusColors[dr.status]}`}>
                      {DEALROOM_STATUS_LABELS[dr.status]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{dr.adresa_scurta}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{buyerCount} cumparator{buyerCount !== 1 ? 'i' : ''}</span>
                    <span>•</span>
                    <span>{offerCount} ofert{offerCount !== 1 ? 'e' : 'a'}</span>
                    <span>•</span>
                    <span>{formatDate(dr.created_at)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
