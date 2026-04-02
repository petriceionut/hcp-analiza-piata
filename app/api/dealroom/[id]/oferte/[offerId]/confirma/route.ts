import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string; offerId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify agent owns this dealroom
  const { data: dealroom } = await supabase
    .from('dealrooms')
    .select('id, adresa_scurta, status')
    .eq('id', params.id)
    .eq('agent_id', user.id)
    .single()

  if (!dealroom) {
    return NextResponse.json({ error: 'DealRoom not found' }, { status: 404 })
  }

  if (dealroom.status === 'inchis') {
    return NextResponse.json({ error: 'DealRoom is already closed' }, { status: 400 })
  }

  // Verify offer belongs to this dealroom
  const { data: offer } = await supabase
    .from('offers')
    .select('*, buyer:buyers(nome, prenume, email, telefon)')
    .eq('id', params.offerId)
    .eq('dealroom_id', params.id)
    .single()

  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  // Accept the offer
  const { error: offerError } = await supabase
    .from('offers')
    .update({ status: 'acceptata' })
    .eq('id', params.offerId)

  if (offerError) {
    return NextResponse.json({ error: offerError.message }, { status: 500 })
  }

  // Close the dealroom
  const { error: dealroomError } = await supabase
    .from('dealrooms')
    .update({ status: 'inchis' })
    .eq('id', params.id)

  if (dealroomError) {
    return NextResponse.json({ error: dealroomError.message }, { status: 500 })
  }

  // Notify the winning buyer
  const buyer = offer.buyer as { nome?: string; prenume?: string; email?: string; telefon?: string } | null
  if (buyer?.email) {
    try {
      await notifyWinningBuyer(buyer.email, buyer.prenume ?? '', buyer.nome ?? '', offer.suma, dealroom.adresa_scurta)
    } catch (e) {
      console.error('Failed to notify winning buyer:', e)
    }
  }

  return NextResponse.json({ success: true })
}

async function notifyWinningBuyer(
  email: string,
  prenume: string,
  nume: string,
  suma: number,
  adresa: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL MOCK] Winning buyer notification to: ${email}`)
    return
  }

  const formatEUR = (n: number) =>
    new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n)

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
      to: email,
      subject: 'Oferta ta a fost acceptata! — HCP Imobiliare',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#16a34a;padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0">🎉 Felicitari!</h1>
          </div>
          <div style="background:#f0fdf4;padding:30px;border-radius:0 0 12px 12px;border:1px solid #bbf7d0;border-top:none">
            <p>Buna ziua, <strong>${prenume} ${nume}</strong>!</p>
            <p>Oferta dumneavoastra de <strong>${formatEUR(suma)}</strong> pentru proprietatea <strong>${adresa}</strong> a fost <strong>acceptata</strong>!</p>
            <p>Agentul imobiliar va lua legatura cu dumneavoastra in cel mai scurt timp pentru a finaliza tranzactia.</p>
            <p>Va multumim ca ati ales HCP Imobiliare!</p>
          </div>
        </div>
      `,
    }),
  })
}
