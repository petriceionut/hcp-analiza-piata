import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      console.error('[trimite] Contract not found:', fetchError)
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const clientData = contract.client_data as { prenume?: string; nume?: string; email?: string } | null
    const clientName = `${clientData?.prenume ?? ''} ${clientData?.nume ?? ''}`.trim() || 'Client'
    const clientEmail = clientData?.email ?? ''

    if (!clientEmail) {
      return NextResponse.json({ error: 'Client email is missing' }, { status: 400 })
    }

    // Check API key
    const apiKey = process.env.SIGNWELL_API_KEY
    console.log('[trimite] SIGNWELL_API_KEY present:', !!apiKey, '| length:', apiKey?.length ?? 0)
    if (!apiKey) {
      return NextResponse.json({ error: 'SIGNWELL_API_KEY not configured' }, { status: 500 })
    }

    // due_date = 14 days from now
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    const dueDateStr = dueDate.toISOString().split('T')[0] // YYYY-MM-DD

    const payload = {
      test_mode: process.env.NODE_ENV !== 'production' ? 1 : 0,
      draft: false,
      name: `Contract ${contract.id}`,
      due_date: dueDateStr,
      files: [
        {
          name: 'contract.pdf',
          base64_file_contents: pdfBase64,
        },
      ],
      recipients: [
        {
          id: '1',
          name: clientName,
          email: clientEmail,
        },
      ],
    }

    console.log('[trimite] Sending to SignWell | recipient:', clientEmail, '| doc name:', payload.name)

    const signwellRes = await fetch('https://www.signwell.com/api/v1/documents/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiKey,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await signwellRes.text()
    console.log('[trimite] SignWell status:', signwellRes.status)
    console.log('[trimite] SignWell response:', responseText)

    if (!signwellRes.ok) {
      return NextResponse.json(
        { error: 'SignWell API error', detail: responseText, status: signwellRes.status },
        { status: 502 }
      )
    }

    const signwellData = JSON.parse(responseText)
    const signwellDocumentId = signwellData.id as string

    // Update contract status in Supabase
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'trimis_client',
        signwell_document_id: signwellDocumentId,
      })
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
