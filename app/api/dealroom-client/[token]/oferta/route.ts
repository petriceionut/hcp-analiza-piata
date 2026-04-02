import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createAdminClient()

  // Find buyer by token
  const { data: buyer } = await supabase
    .from('buyers')
    .select('*, dealroom:dealrooms(*)')
    .eq('token', params.token)
    .single()

  if (!buyer) {
    return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
  }

  const dealroom = buyer.dealroom
  if (dealroom.status === 'inchis') {
    return NextResponse.json({ error: 'DealRoom is closed' }, { status: 400 })
  }

  // Check if buyer already submitted an offer
  const { data: existingOffer } = await supabase
    .from('offers')
    .select('id')
    .eq('dealroom_id', dealroom.id)
    .eq('buyer_id', buyer.id)
    .single()

  if (existingOffer) {
    return NextResponse.json({ error: 'Already submitted an offer' }, { status: 400 })
  }

  const { suma, mesaj } = await request.json()

  if (!suma || suma <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  // Save offer
  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      dealroom_id: dealroom.id,
      buyer_id: buyer.id,
      suma,
      mesaj,
      status: 'in_asteptare',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify other buyers that an offer was made (anonymous)
  const { data: otherBuyers } = await supabase
    .from('buyers')
    .select('*')
    .eq('dealroom_id', dealroom.id)
    .neq('id', buyer.id)

  const notificationMsg = `Informare DealRoom: Cineva a trimis o oferta pentru proprietatea "${dealroom.adresa_scurta}". Intrați pe DealRoom pentru a vedea actualizarile.`

  if (otherBuyers && process.env.TWILIO_ACCOUNT_SID) {
    for (const b of otherBuyers) {
      if (!b.telefon) continue
      try {
        const formattedTo = `whatsapp:+4${b.telefon.replace(/^0/, '')}`
        await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
              ).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
              To: formattedTo,
              Body: notificationMsg,
            }),
          }
        )
      } catch (e) {
        console.error('WhatsApp notify error:', e)
      }
    }
  }

  // Also notify agent
  const { data: agentData } = await supabase.auth.admin.getUserById(dealroom.agent_id)
  if (agentData?.user?.email && process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
        to: agentData.user.email,
        subject: `Oferta noua: ${suma} EUR — ${dealroom.adresa_scurta}`,
        html: `<p>Ai primit o oferta noua de <strong>${suma} EUR</strong> pentru proprietatea <strong>${dealroom.adresa_scurta}</strong>.</p>
               ${mesaj ? `<p>Mesaj: "${mesaj}"</p>` : ''}
               <p>Logheaza-te in aplicatie pentru a vedea si gestiona oferta.</p>`,
      }),
    }).catch(console.error)
  } else {
    console.log(`[AGENT OFFER NOTIFY] New offer: ${suma} EUR for ${dealroom.adresa_scurta}`)
  }

  return NextResponse.json(offer)
}
