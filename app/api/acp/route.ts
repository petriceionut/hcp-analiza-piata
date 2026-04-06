import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ACPSubiect, ACPComparabila } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subiect, comparabile } = await request.json() as {
    subiect: ACPSubiect
    comparabile: ACPComparabila[]
  }

  const compRows = comparabile.map((c, i) => {
    const pretMp = Math.round(c.pret_cerut / c.suprafata)
    return `${i + 1}. ${c.adresa} — ${c.suprafata} mp${c.nr_camere ? `, ${c.nr_camere} cam` : ''}${c.etaj ? `, etaj ${c.etaj}` : ''}, ${c.stare}, ${c.pret_cerut.toLocaleString('ro-RO')} RON (${pretMp} RON/mp)`
  }).join('\n')

  const subiectBlock = [
    `Tip: ${subiect.tip}`,
    `Adresa/Zona: ${subiect.adresa}`,
    `Suprafata: ${subiect.suprafata} mp`,
    subiect.nr_camere ? `Nr camere: ${subiect.nr_camere}` : null,
    subiect.etaj ? `Etaj: ${subiect.etaj}` : null,
    subiect.an_constructie ? `An constructie: ${subiect.an_constructie}` : null,
    `Stare: ${subiect.stare}`,
    subiect.pret_solicitat ? `Pret solicitat de client: ${subiect.pret_solicitat.toLocaleString('ro-RO')} RON` : null,
  ].filter(Boolean).join('\n')

  const prompt = `Esti un expert imobiliar din Romania. Un agent imobiliar ti-a furnizat urmatoarea proprietate subiect si comparabilele sale din piata.

PROPRIETATEA SUBIECT:
${subiectBlock}

COMPARABILE INTRODUSE DE AGENT (${comparabile.length} proprietati):
${compRows}

Pe baza acestor date reale furnizate de agent, genereaza o analiza comparativa de piata (ACP) profesionala. Tine cont de diferentele intre proprietati (suprafata, etaj, stare, zona) pentru a ajusta valorile.

Returneaza DOAR un JSON valid, fara text suplimentar, cu aceasta structura exacta:
{
  "pret_recomandat_min": <numar intreg RON>,
  "pret_recomandat_max": <numar intreg RON>,
  "pret_recomandat": <numar intreg RON, valoarea optima>,
  "analiza": "<paragraf de 100-200 de cuvinte cu analiza pietei, justificarea pretului recomandat si tendinte>",
  "observatii_comparabile": [<string pentru fiecare comparabila, scurt, ex: "Suprafata mai mica, stare similara, pret/mp mai mare cu 8%">]
}

Numarul de elemente din observatii_comparabile trebuie sa fie exact ${comparabile.length}.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (error) {
    console.error('ACP error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
