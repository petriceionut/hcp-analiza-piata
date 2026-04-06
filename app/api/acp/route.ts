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
    const parts = [
      `${i + 1}. ${c.adresa}`,
      `${c.suprafata} mp`,
      c.nr_camere ? `${c.nr_camere} cam` : null,
      c.etaj ? `etaj ${c.etaj}` : null,
      c.stare ?? null,
      `€${c.pret_cerut.toLocaleString('ro-RO')} (€${pretMp}/mp)`,
    ].filter(Boolean)
    return parts.join(' — ')
  }).join('\n')

  const subiectLines = [
    `Tip: ${subiect.tip}`,
    `Adresa/Zona: ${subiect.adresa}`,
    subiect.tip === 'Casa/Vila'
      ? `Suprafata utila: ${subiect.suprafata} mp${subiect.suprafata_teren ? `, teren: ${subiect.suprafata_teren} mp` : ''}`
      : `Suprafata: ${subiect.suprafata} mp`,
    subiect.nr_camere ? `Nr camere: ${subiect.nr_camere}` : null,
    subiect.nr_etaje ? `Nr etaje: ${subiect.nr_etaje}${subiect.mansarda ? ' + mansarda' : ''}` : null,
    subiect.mansarda && !subiect.nr_etaje ? 'Mansarda: da' : null,
    subiect.etaj ? `Etaj: ${subiect.etaj}` : null,
    subiect.an_constructie ? `An constructie: ${subiect.an_constructie}` : null,
    subiect.stare ? `Stare: ${subiect.stare}` : null,
    subiect.deschidere_strada ? `Deschidere la strada: ${subiect.deschidere_strada} m` : null,
    subiect.clasificare ? `Clasificare: ${subiect.clasificare}` : null,
    subiect.utilitati?.length ? `Utilitati: ${subiect.utilitati.join(', ')}` : null,
    subiect.pret_solicitat ? `Pret solicitat client: €${subiect.pret_solicitat.toLocaleString('ro-RO')}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `Esti un expert imobiliar din Romania. Un agent imobiliar ti-a furnizat o proprietate subiect si comparabilele din piata. Toate preturile sunt in EUR (Euro).

PROPRIETATEA SUBIECT:
${subiectLines}

COMPARABILE INTRODUSE DE AGENT (${comparabile.length}):
${compRows}

Analizeaza datele si genereaza o analiza comparativa de piata profesionala. Tine cont de diferentele intre proprietati (suprafata, etaj, stare, zona, utilitati) pentru a ajusta valorile si a recomanda un interval de pret realist in EUR pentru proprietatea subiect.

Returneaza DOAR un JSON valid, fara text suplimentar:
{
  "pret_recomandat_min": <numar intreg EUR>,
  "pret_recomandat_max": <numar intreg EUR>,
  "pret_recomandat": <numar intreg EUR, valoarea optima>,
  "analiza": "<paragraf 100-200 cuvinte cu analiza pietei, justificarea pretului si tendinte>",
  "observatii_comparabile": [<string scurt pentru fiecare comparabila, ex: "Suprafata mai mica cu 5%, stare similara, pret/mp cu 8% mai mare">]
}

observatii_comparabile trebuie sa aiba exact ${comparabile.length} elemente.`

  let rawText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('[acp] Claude raw response:', rawText.slice(0, 500))
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[acp] No JSON found in response. Full text:', rawText)
      throw new Error('No JSON in response')
    }
    const parsed = JSON.parse(jsonMatch[0])
    // Validate required fields
    const required = ['pret_recomandat_min', 'pret_recomandat_max', 'pret_recomandat', 'analiza', 'observatii_comparabile']
    for (const field of required) {
      if (!(field in parsed)) console.warn(`[acp] Missing field in response: ${field}`)
    }
    return NextResponse.json(parsed)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[acp] Error:', msg)
    if (rawText) console.error('[acp] Raw text at failure:', rawText.slice(0, 1000))
    return NextResponse.json({ error: 'Analysis failed', detail: msg }, { status: 500 })
  }
}
