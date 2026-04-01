import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const EVENT_STATUS_MAP: Record<string, string> = {
  'document.viewed':    'vizualizat_client',
  'document.signed':    'semnat_client',
  'document.completed': 'semnat_ambele',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const eventType: string = body?.event?.type ?? body?.type ?? ''
    const documentId: string = body?.document?.id ?? body?.data?.document_id ?? ''

    if (!documentId) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 })
    }

    const newStatus = EVENT_STATUS_MAP[eventType]
    if (!newStatus) {
      // Unknown event — acknowledge without acting
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('contracts')
      .update({ status: newStatus })
      .eq('signwell_document_id', documentId)

    if (error) throw error

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[POST /api/signwell/webhook]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
