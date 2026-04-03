import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Home, Plus } from 'lucide-react'
import { DealRoom } from '@/types'
import DealRoomCard from '@/components/dealroom/DealRoomCard'

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
          {list.map((dr) => (
            <DealRoomCard key={dr.id} dr={dr} />
          ))}
        </div>
      )}
    </div>
  )
}
