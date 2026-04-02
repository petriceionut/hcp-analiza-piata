import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const { token, signerType, signature } = await request.json()

  // Find contract by token
  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .or(`client_token.eq.${token},agent_token.eq.${token}`)
    .single()

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  const now = new Date().toISOString()

  if (signerType === 'client') {
    // Save client signature
    const { error } = await supabase
      .from('contracts')
      .update({
        client_semnatura: signature,
        client_semnat_la: now,
        status: 'semnat_client',
      })
      .eq('id', contract.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notify agent to sign
    await notifyAgentToSign(contract, supabase)

    return NextResponse.json({ success: true, message: 'Client signed successfully' })
  } else if (signerType === 'agent') {
    // Save agent signature
    const { error } = await supabase
      .from('contracts')
      .update({
        agent_semnatura: signature,
        agent_semnat_la: now,
        status: 'semnat_ambele',
      })
      .eq('id', contract.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create DealRoom automatically after both parties signed
    await createDealRoom(contract, supabase)

    // Send final copy to client
    await sendSignedCopyToClient(contract, supabase)

    return NextResponse.json({ success: true, message: 'Contract fully signed' })
  }

  return NextResponse.json({ error: 'Invalid signer type' }, { status: 400 })
}

async function notifyAgentToSign(contract: Record<string, unknown>, supabase: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const agentSignLink = `${appUrl}/semneaza/${contract.agent_token}`

  // Get agent email
  const { data: agentData } = await supabase.auth.admin.getUserById(contract.agent_id as string)
  const agentEmail = agentData?.user?.email

  const clientData = contract.client_data as Record<string, string>
  const clientName = `${clientData?.prenume} ${clientData?.nume}`

  if (agentEmail) {
    try {
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
            to: agentEmail,
            subject: `${clientName} a semnat contractul — semnatura ta este necesara`,
            html: `<p>Clientul <strong>${clientName}</strong> a semnat contractul. Acceseaza link-ul de mai jos pentru a semna si tu:</p>
                   <p><a href="${agentSignLink}">${agentSignLink}</a></p>`,
          }),
        })
      } else {
        console.log(`[AGENT SIGN NOTIFICATION] Email: ${agentEmail}, Link: ${agentSignLink}`)
      }
    } catch (e) {
      console.error('Failed to notify agent:', e)
    }
  }
}

async function createDealRoom(contract: Record<string, unknown>, supabase: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>) {
  try {
    const propertyData = contract.property_data as Record<string, unknown>
    const adresa = propertyData?.adresa as string ?? ''
    const adresaScurta = adresa.split(',').slice(0, 2).join(',').trim()

    const { generateToken } = await import('@/lib/utils')

    await supabase.from('dealrooms').insert({
      contract_id: contract.id,
      agent_id: contract.agent_id,
      tip_proprietate: propertyData?.tip_proprietate ?? 'apartament',
      adresa_scurta: adresaScurta || adresa,
      status: 'activ',
      owner_token: generateToken(),
    })
  } catch (e) {
    console.error('Failed to create DealRoom:', e)
  }
}

async function sendSignedCopyToClient(contract: Record<string, unknown>, supabase: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>) {
  const clientData = contract.client_data as Record<string, string>
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (process.env.RESEND_API_KEY && clientData?.email) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
          to: clientData.email,
          subject: 'Contractul a fost semnat de ambele parti — HCP Imobiliare',
          html: `<p>Buna ziua, <strong>${clientData.prenume} ${clientData.nume}</strong>!</p>
                 <p>Contractul a fost semnat de ambele parti si este acum finalizat.</p>
                 <p>Va multumim pentru incredere!</p>
                 <p><em>HCP Imobiliare</em></p>`,
        }),
      })
    } catch (e) {
      console.error('Failed to send signed copy:', e)
    }
  } else {
    console.log(`[SIGNED COPY] Would send to: ${clientData?.email}`)
  }
}
