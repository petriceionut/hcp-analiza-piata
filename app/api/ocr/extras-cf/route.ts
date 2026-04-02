import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  try {
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Aceasta este o imagine a unui extras de carte funciara romanesc. Extrage urmatoarele informatii si returneaza-le EXCLUSIV ca JSON, fara text suplimentar:

{
  "adresa": "<adresa proprietatii>",
  "nr_cadastral": "<numarul cadastral>",
  "nr_carte_funciara": "<numarul cartii funciare>",
  "suprafata_construita": <numar mp sau null>,
  "suprafata_utila": <numar mp sau null>,
  "suprafata_teren": <numar mp sau null>,
  "tip_proprietate": "<apartament/casa/teren/spatiu_comercial>",
  "nr_camere": <numar sau null>,
  "etaj": "<etaj sau null>",
  "an_constructie": <an sau null>
}

Daca nu poti citi un camp, pune null. Returneaza DOAR JSON-ul, fara alte explicatii.`,
            },
          ],
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not extract data' }, { status: 422 })
    }

    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json(extracted)
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({ error: 'OCR processing failed' }, { status: 500 })
  }
}
