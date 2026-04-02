import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { method } = await request.json()

  // Get contract
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .eq('agent_id', user.id)
    .single()

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const signingLink = `${appUrl}/semneaza/${contract.client_token}`

  const clientName = `${contract.client_data?.prenume} ${contract.client_data?.nume}`

  if (method === 'email') {
    // Send email with signing link
    try {
      await sendEmail({
        to: contract.client_data.email,
        subject: 'Contract pentru semnare — HCP Imobiliare',
        html: buildEmailTemplate(clientName, signingLink, contract.tip_contract),
      })
    } catch (e) {
      console.error('Email send error:', e)
      // Don't fail the request if email fails, just log
    }
  } else if (method === 'whatsapp') {
    // Send WhatsApp message
    try {
      await sendWhatsApp({
        to: contract.client_data.telefon,
        message: `Buna ziua, ${clientName}! Aveti un contract de semnat de la HCP Imobiliare. Accesati link-ul urmator pentru a vizualiza si semna contractul: ${signingLink}`,
      })
    } catch (e) {
      console.error('WhatsApp send error:', e)
    }
  }

  // Update contract status
  await supabase
    .from('contracts')
    .update({ status: 'trimis_client' })
    .eq('id', params.id)

  return NextResponse.json({ success: true, signingLink })
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL MOCK] To: ${to}\nSubject: ${subject}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) throw new Error('Email API error')
}

async function sendWhatsApp({ to, message }: { to: string; message: string }) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[WHATSAPP MOCK] To: ${to}\nMessage: ${message}`)
    return
  }

  const formattedTo = `whatsapp:+4${to.replace(/^0/, '')}`

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

function buildEmailTemplate(clientName: string, signingLink: string, contractType: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1e40af; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">HCP Imobiliare</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px; color: #1e293b;">Buna ziua, <strong>${clientName}</strong>,</p>
        <p style="color: #475569;">Va rugam sa accesati link-ul de mai jos pentru a vizualiza si semna contractul:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signingLink}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Semneaza contractul
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">
          Sau copiati acest link in browser: ${signingLink}
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          HCP Imobiliare &bull; Platforma de semnatura digitala
        </p>
      </div>
    </body>
    </html>
  `
}
