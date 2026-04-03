import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ACPRequest, ACPResult } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  let prompt: string

  if (body.mode === 'text') {
    prompt = buildTextPrompt(body.query)
  } else {
    prompt = buildFormPrompt(body.data as ACPRequest)
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                      responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const result: ACPResult = JSON.parse(jsonStr)

    return NextResponse.json(result)
  } catch (error) {
    console.error('ACP analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

function buildFormPrompt(data: ACPRequest): string {
  return `Esti un expert imobiliar din Romania. Genereaza o analiza comparativa de piata (ACP) pentru urmatoarea proprietate:

Tip: ${data.tip_proprietate}
Judet: ${data.judet}
Localitate/Zona: ${data.localitate}
Suprafata: ${data.suprafata_mp} mp
${data.nr_camere ? `Numar camere: ${data.nr_camere}` : ''}
${data.an_constructie ? `An constructie: ${data.an_constructie}` : ''}
${data.etaj ? `Etaj: ${data.etaj}` : ''}
${data.observatii ? `Observatii: ${data.observatii}` : ''}

Genereaza un JSON cu urmatoarea structura exacta:
\`\`\`json
{
  "pret_minim": <numar EUR>,
  "pret_maxim": <numar EUR>,
  "pret_median": <numar EUR>,
  "pret_mediu": <numar EUR>,
  "pret_mp_mediu": <numar EUR/mp>,
  "recomandare_pret": <numar EUR>,
  "analiza_text": "<paragraf cu analiza detaliata a pietei, minim 150 cuvinte>",
  "factori_pozitivi": ["<factor 1>", "<factor 2>", "<factor 3>", "<factor 4>"],
  "factori_negativi": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "proprietati_comparabile": [
    {
      "adresa": "<strada si numar aproximativ>",
      "pret": <numar EUR>,
      "suprafata": <numar mp>,
      "pret_mp": <numar EUR/mp>,
      "nr_camere": <numar sau null>,
      "an_constructie": <an sau null>,
      "sursa": "imobiliare.ro",
      "data_listare": "<luna an>"
    }
  ]
}
\`\`\`

Bazeaza-te pe cunostintele tale despre piata imobiliara romaneasca. Proprietatile comparabile trebuie sa fie realiste pentru zona respectiva. Preturile trebuie sa reflecte piata actuala din Romania (2024-2025).`
}

function buildTextPrompt(query: string): string {
  return `Esti un expert imobiliar din Romania. Un agent imobiliar iti cere o analiza comparativa de piata (ACP) pe baza urmatoarei descrieri:

"${query}"

Extrage informatiile relevante din descriere si genereaza un JSON cu urmatoarea structura exacta:
\`\`\`json
{
  "pret_minim": <numar EUR>,
  "pret_maxim": <numar EUR>,
  "pret_median": <numar EUR>,
  "pret_mediu": <numar EUR>,
  "pret_mp_mediu": <numar EUR/mp>,
  "recomandare_pret": <numar EUR>,
  "analiza_text": "<paragraf cu analiza detaliata a pietei, minim 150 cuvinte>",
  "factori_pozitivi": ["<factor 1>", "<factor 2>", "<factor 3>", "<factor 4>"],
  "factori_negativi": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "proprietati_comparabile": [
    {
      "adresa": "<strada si numar aproximativ>",
      "pret": <numar EUR>,
      "suprafata": <numar mp>,
      "pret_mp": <numar EUR/mp>,
      "nr_camere": <numar sau null>,
      "an_constructie": <an sau null>,
      "sursa": "imobiliare.ro",
      "data_listare": "<luna an>"
    }
  ]
}
\`\`\`

Bazeaza-te pe cunostintele tale despre piata imobiliara romaneasca. Preturile trebuie sa reflecte piata actuala din Romania (2024-2025).`
}
