import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BuyerDealRoomView from '@/components/dealroom/BuyerDealRoomView'
import { Buyer, DealRoom, DealRoomDocument, Offer } from '@/types'

export default async function BuyerDealRoomPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createAdminClient()

  // Find buyer by token
  const { data: buyer } = await supabase
    .from('buyers')
    .select('*, dealroom:dealrooms(*)')
    .eq('token', params.token)
    .single()

  if (!buyer) notFound()

  const dealroom = buyer.dealroom as DealRoom

  // Fetch documents and offers (anonymous count for offers)
  const [
    { data: documente },
    { data: oferte },
    { data: allBuyers },
  ] = await Promise.all([
    supabase
      .from('dealroom_documents')
      .select('*')
      .eq('dealroom_id', dealroom.id)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('offers')
      .select('id, suma, mesaj, status, created_at, buyer_id')
      .eq('dealroom_id', dealroom.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('buyers')
      .select('id')
      .eq('dealroom_id', dealroom.id),
  ])

  // Find this buyer's offer if any
  const myOffer = oferte?.find((o) => o.buyer_id === buyer.id)

  return (
    <BuyerDealRoomView
      buyer={buyer as Buyer}
      dealroom={dealroom}
      documente={(documente ?? []) as DealRoomDocument[]}
      oferte={(oferte ?? []) as Offer[]}
      buyerCount={(allBuyers ?? []).length}
      myOffer={myOffer as Offer | undefined}
    />
  )
}
