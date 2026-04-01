import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ClientRow = { prenume?: string; nume?: string; email?: string } | null

// Hardcoded agent constants (must match ContractPreviewContent)
const AGENT_NUME  = 'PETRICE JOAN'
const AGENT_EMAIL = 'joan.petrice@homoecapital.ro'

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

    // Fetch contract — include client_data2 for co-proprietar
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, client_data, client_data2, tip_contract')
      .eq('id', params.id)
      .eq('agent_id', user.id)
      .single()

    if (fetchError || !contract) {
      console.error('[trimite] Contract not found:', fetchError)
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const c1 = contract.client_data as ClientRow
    const c2 = contract.client_data2 as ClientRow

    const client1Name  = `${c1?.prenume ?? ''} ${c1?.nume ?? ''}`.trim() || 'Client'
    const client1Email = c1?.email ?? ''

    if (!client1Email) {
      return NextResponse.json({ error: 'Client email is missing' }, { status: 400 })
    }

    // Check API key
    const apiKey = process.env.SIGNWELL_API_KEY
    console.log('[trimite] SIGNWELL_API_KEY present:', !!apiKey, '| length:', apiKey?.length ?? 0)
    if (!apiKey) {
      return NextResponse.json({ error: 'SIGNWELL_API_KEY not configured' }, { status: 500 })
    }

    // Build recipients — client 1 always, client 2 only if co-proprietar email exists
    const recipients: { id: string; name: string; email: string; placeholder_name: string }[] = [
      {
        id: '1',
        name: client1Name,
        email: client1Email,
        placeholder_name: 'CLIENT_1',
      },
    ]

    const client2Email = c2?.email ?? ''
    if (client2Email) {
      const client2Name = `${c2?.prenume ?? ''} ${c2?.nume ?? ''}`.trim() || 'Co-proprietar'
      recipients.push({
        id: '2',
        name: client2Name,
        email: client2Email,
        placeholder_name: 'CLIENT_2',
      })
    }

    // Agent receives a CC copy (not a signer)
    const agentEmail = user.email ?? AGENT_EMAIL
    const agentName  = (user.user_metadata?.full_name as string | undefined) ?? AGENT_NUME
    const ccs = [{ name: agentName, email: agentEmail }]

    // due_date = 14 days from now
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const payload = {
      test_mode: process.env.NODE_ENV !== 'production' ? 1 : 0,
      draft: false,
      name: `Contract ${contract.id}`,
      due_date: dueDateStr,
      files: [{ name: 'contract.pdf', base64_file_contents: pdfBase64 }],
      recipients,
      ccs,
    }

    console.log(
      '[trimite] Sending to SignWell | recipients:',
      recipients.map((r) => `${r.name} <${r.email}>`).join(', '),
      '| cc:', agentEmail,
      '| doc:', payload.name,
    )
    // Log payload without the large base64 blob
    console.log('[trimite] Payload (no file):', JSON.stringify({ ...payload, files: '[omitted]' }))

    const signwellRes = await fetch('https://www.signwell.com/api/v1/documents/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiKey,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await signwellRes.text()
    console.log('[trimite] SignWell HTTP status:', signwellRes.status)
    console.log('[trimite] SignWell full response:', responseText)

    if (!signwellRes.ok) {
      return NextResponse.json(
        { error: 'SignWell API error', detail: responseText, httpStatus: signwellRes.status },
        { status: 502 }
      )
    }

    const signwellData = JSON.parse(responseText)
    const signwellDocumentId = signwellData.id as string

    // Update contract in Supabase
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ status: 'trimis_client', signwell_document_id: signwellDocumentId })
      .eq('id', params.id)

    if (updateError) {
      console.error('[trimite] Supabase update error:', updateError)
      throw updateError
    }

    console.log('[trimite] Success | signwell_document_id:', signwellDocumentId)
    return NextResponse.json({ signwellDocumentId })
  } catch (err) {
    console.error('[POST /api/contracts/[id]/trimite] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
