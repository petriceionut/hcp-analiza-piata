import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[POST /api/contracts] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('[POST /api/contracts] Inserting for user:', user.id, 'tipContract:', body.tipContract)

    const { data, error } = await supabase
      .from('contracts')
      .insert({
        agent_id: user.id,
        tip_contract: body.tipContract,
        client_data: body.clientData,
        client_data2: body.clientData2 ?? null,
        property_data: body.propertyData,
        durata: body.durata,
        data_incepere: body.dataIncepere ?? null,
        comision: body.comision,
        vicii_cunoscute: body.viciiCunoscute ?? null,
        pret_minim: body.pretMinim ?? null,
        clarificari: body.clarificari ?? null,
        cheltuieli_lunare: body.cheltuieliLunare ?? null,
        derogari: body.derogari ?? null,
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[POST /api/contracts] Supabase error:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Database error', detail: error.message, code: error.code },
        { status: 400 }
      )
    }

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('[POST /api/contracts] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
