import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DealRoom, Buyer, Offer, DealRoomDocument, DealRoomClient, DocumentScanat } from '@/types'
import { PROPERTY_ICONS, PROPERTY_TYPES, DEALROOM_STATUS_LABELS } from '@/lib/utils'
import DealRoomAgentDashboard from '@/components/dealroom/DealRoomAgentDashboard'

export default async function DealRoomDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: dealroom },
    { data: documente },
    { data: cumparatori },
    { data: oferte },
    { data: clienti },
    { data: documenteScanate },
  ] = await Promise.all([
    supabase
      .from('dealrooms')
      .select('*')
      .eq('id', params.id)
      .eq('agent_id', user?.id)
      .single(),
    supabase
      .from('dealroom_documents')
      .select('*')
      .eq('dealroom_id', params.id)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('buyers')
      .select('*')
      .eq('dealroom_id', params.id)
      .order('added_at', { ascending: false }),
    supabase
      .from('offers')
      .select('*, buyer:buyers(nume, prenume)')
      .eq('dealroom_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('dealroom_clients')
      .select('*')
      .eq('dealroom_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('documente_scanate')
      .select('*')
      .eq('dealroom_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (!dealroom) notFound()

  const dr = dealroom as DealRoom
  const icon = PROPERTY_ICONS[dr.tip_proprietate]

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dealroom"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Inapoi la DealRoom
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="text-4xl">{icon}</div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {PROPERTY_TYPES[dr.tip_proprietate]}
          </h1>
          <p className="text-slate-500">{dr.adresa_scurta}</p>
        </div>
        <div className="ml-auto">
          <span className={`badge text-sm px-3 py-1 ${
            dr.status === 'activ' ? 'bg-green-100 text-green-700' :
            dr.status === 'oferta_acceptata' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {DEALROOM_STATUS_LABELS[dr.status]}
          </span>
        </div>
      </div>

      <DealRoomAgentDashboard
        dealroom={dr}
        documente={(documente ?? []) as DealRoomDocument[]}
        cumparatori={(cumparatori ?? []) as Buyer[]}
        oferte={(oferte ?? []) as (Offer & { buyer: { nume: string; prenume: string } })[]}
        clienti={(clienti ?? []) as DealRoomClient[]}
        documenteScanate={(documenteScanate ?? []) as DocumentScanat[]}
      />
    </div>
  )
}
