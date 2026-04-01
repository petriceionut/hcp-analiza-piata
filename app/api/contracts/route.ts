import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const { data, error } = await supabase
      .from('contracts')
      .insert({
        agent_id: user.id,
        tip_contract: body.tipContract,
        client_data: body.clientData,
        client_data2: body.clientData2 ?? null,
        property_data: body.propertyData,
        durata: body.durata,
        data_incepere: body.dataIncepere,
        comision: body.comision,
        vicii_cunoscute: body.viciiCunoscute,
        pret_minim: body.pretMinim,
        clarificari: body.clarificari,
        cheltuieli_lunare: body.cheltuieliLunare,
        derogari: body.derogari,
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('[POST /api/contracts]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
