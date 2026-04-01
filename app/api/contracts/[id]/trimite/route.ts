import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SignWellSigner {
  id: string
  name: string
  email: string
}

interface SignWellFile {
  name: string
  file_base64: string
}

interface SignWellDocumentPayload {
  test_mode: boolean
  files: SignWellFile[]
  signers: SignWellSigner[]
  name: string
  subject: string
  message: string
  send_emails: boolean
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { pdfBase64 } = await req.json()
    if (!pdfBase64) return NextResponse.json({ error: 'pdfBase64 is required' }, { status: 400 })

    // Fetch contract from Supabase
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, client_data, tip_contract')
      .eq('id', params.id)
      .eq('agent_id', user.id)
      .single()

    if (fetchError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const clientData = contract.client_data as { prenume?: string; nume?: string; email?: string } | null
    const clientName = `${clientData?.prenume ?? ''} ${clientData?.nume ?? ''}`.trim() || 'Client'
    const clientEmail = clientData?.email ?? ''

    if (!clientEmail) {
      return NextResponse.json({ error: 'Client email is missing' }, { status: 400 })
    }

    // Call SignWell API
    const apiKey = process.env.SIGNWELL_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'SIGNWELL_API_KEY not configured' }, { status: 500 })
    }

    const payload: SignWellDocumentPayload = {
      test_mode: process.env.NODE_ENV !== 'production',
      name: `Contract ${contract.id}`,
      subject: 'Vă rugăm să semnați contractul',
      message: 'Ați primit un contract pentru semnare. Vă rugăm să îl revizuiți și semnați.',
      send_emails: true,
      files: [
        {
          name: 'contract.pdf',
          file_base64: pdfBase64,
        },
      ],
      signers: [
        {
          id: '1',
          name: clientName,
          email: clientEmail,
        },
      ],
    }

    const signwellRes = await fetch('https://www.signwell.com/api/v1/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!signwellRes.ok) {
      const errBody = await signwellRes.text()
      console.error('[SignWell API error]', signwellRes.status, errBody)
      return NextResponse.json({ error: 'SignWell API error', detail: errBody }, { status: 502 })
    }

    const signwellData = await signwellRes.json()
    const signwellDocumentId = signwellData.id as string

    // Update contract status in Supabase
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'trimis_client',
        signwell_document_id: signwellDocumentId,
      })
      .eq('id', params.id)

    if (updateError) throw updateError

    return NextResponse.json({ signwellDocumentId })
  } catch (err) {
    console.error('[POST /api/contracts/[id]/trimite]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
