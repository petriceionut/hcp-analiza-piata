import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateToken } from '@/lib/utils'
import { sendEmail } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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
    return NextResponse.json({ error: 'DealRoom is closed' }, { status: 400 })
  }

  const { nume, prenume, telefon, email } = await request.json()

  if (!nume || !prenume || !telefon) {
    return NextResponse.json({ error: 'Missing required fields: nume, prenume, telefon' }, { status: 400 })
  }

  const token = generateToken()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const buyerLink = `${appUrl}/dealroom-client/${token}`

  const { data: buyer, error: insertError } = await supabase
    .from('buyers')
    .insert({
      dealroom_id: params.id,
      nume,
      prenume,
      telefon,
      email: email || null,
      token,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Send WhatsApp notification
  const message = `Buna ziua, ${prenume} ${nume}! Agentul imobiliar va invita sa vizualizati o proprietate in sistemul HCP DealRoom. Accesati link-ul securizat: ${buyerLink}`

  try {
    await sendWhatsApp(telefon, message)
  } catch (e) {
    console.error('WhatsApp notification failed:', e)
    // Don't fail the request
  }

  // Send email if provided
  if (email) {
    try {
      await sendBuyerEmail(email, prenume, nume, buyerLink, dealroom.adresa_scurta)
    } catch (e) {
      console.error('Email notification failed:', e)
    }
  }

  return NextResponse.json(buyer)
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: buyers, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('dealroom_id', params.id)
    .order('added_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(buyers)
}

async function sendWhatsApp(telefon: string, message: string) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[WHATSAPP MOCK] To: ${telefon}\nMessage: ${message}`)
    return
  }

  const formattedTo = `whatsapp:+4${telefon.replace(/^0/, '')}`

  const res = await fetch(
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
        Body: message,
      }),
    }
  )

  if (!res.ok) throw new Error('WhatsApp API error')
}

async function sendBuyerEmail(
  email: string,
  prenume: string,
  nume: string,
  buyerLink: string,
  adresa: string
) {
  await sendEmail(
    email,
    'Invitatie DealRoom — HCP Imobiliare',
    `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#1d4ed8;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0">HCP DealRoom</h1>
        </div>
        <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
          <p>Buna ziua, <strong>${prenume} ${nume}</strong>!</p>
          <p>Ati fost invitat sa vizualizati o proprietate: <strong>${adresa}</strong></p>
          <p>Accesati spatiul securizat de negociere:</p>
          <div style="text-align:center;margin:30px 0">
            <a href="${buyerLink}" style="background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
              Acceseaza DealRoom
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px">Sau copiati: ${buyerLink}</p>
        </div>
      </div>
    `,
  )
}
