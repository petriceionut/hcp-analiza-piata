'use client'

import { useEffect, useState } from 'react'
import { WizardData } from './ContractWizard'

interface Props {
  data: WizardData
  agentName?: string   // kept for signature display; contract body uses hardcoded agent
  showSignatures?: boolean
  clientSignature?: string
  agentSignature?: string
  onTextReady?: (text: string) => void
}

const CONTRACT_FILE: Record<string, string> = {
  mandat_exclusivitate: '/contracts/contract-exclusiv-complet.txt',
  mediere_vanzare: '/contracts/contract-intermediere-complet.txt',
  antecontract_vanzare: '/contracts/contract-exclusiv-suplu.txt',
  mediere_inchiriere: '/contracts/contract-intermediere-suplu.txt',
}

function computeExpiryDate(durata: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + durata)
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Hardcoded agent details — update here when agent changes
const AGENT_NUME  = 'PETRICE IOAN'
const AGENT_TEL   = '0758372760'
const AGENT_EMAIL = 'ioan.petrice@homoecapital.ro'

function applyPlaceholders(text: string, data: WizardData): string {
  const c1 = data.clientData  ?? {}
  const c2 = data.clientData2 ?? {}
  const property = data.propertyData ?? {}
  const today = new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })

  const formatDate = (iso: string) => {
    if (!iso) return '______'
    const [y, m, d] = iso.split('-')
    return new Date(Number(y), Number(m) - 1, Number(d))
      .toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const map: Record<string, string> = {
    // Agent — hardcoded
    '{{AGENT_NUME}}':        AGENT_NUME,
    '{{AGENT_TEL}}':         AGENT_TEL,
    '{{AGENT_EMAIL}}':       AGENT_EMAIL,

    // Client 1
    '{{NUME_CLIENT}}':       c1.nume              ?? '______',
    '{{PRENUME_CLIENT}}':    c1.prenume           ?? '______',
    '{{CNP}}':               c1.cnp               ?? '______',
    '{{SERIE_BULETIN}}':     c1.serie_buletin     ?? '______',
    '{{NR_BULETIN}}':        c1.nr_buletin        ?? '______',
    '{{ADRESA_CLIENT}}':     c1.adresa_domiciliu  ?? '______',
    '{{JUDET_SECTOR}}':      '______',
    '{{TEL_CLIENT}}':        c1.telefon           ?? '______',
    '{{EMAIL_CLIENT}}':      c1.email             ?? '______',

    // Client 2 (co-proprietar)
    '{{NUME_CLIENT2}}':      c2.nume              ?? '______',
    '{{PRENUME_CLIENT2}}':   c2.prenume           ?? '______',
    '{{CNP2}}':              c2.cnp               ?? '______',
    '{{SERIE_BULETIN2}}':    c2.serie_buletin     ?? '______',
    '{{NR_BULETIN2}}':       c2.nr_buletin        ?? '______',
    '{{ADRESA_CLIENT2}}':    c2.adresa_domiciliu  ?? '______',
    '{{TEL_CLIENT2}}':       c2.telefon           ?? '______',
    '{{EMAIL_CLIENT2}}':     c2.email             ?? '______',

    // Property
    '{{ADRESA_IMOBIL}}':     property.adresa              ?? '______',
    '{{DESCRIERE_IMOBIL}}':  property.adresa              ?? '______',
    '{{NR_CF}}':             property.nr_carte_funciara   ?? '______',
    '{{NR_CADASTRAL}}':      property.nr_cadastral        ?? '______',

    // Contract conditions
    '{{COMISION}}':          data.comision      != null ? String(data.comision)      : '____',
    '{{DURATA}}':            data.durata        != null ? String(data.durata)        : '__',
    '{{DATA_EXPIRARE}}':     data.durata        != null ? computeExpiryDate(data.durata) : '______',
    '{{DATA_INCEPERE}}':     data.dataIncepere  ? formatDate(data.dataIncepere)  : '______',
    '{{VICII_CUNOSCUTE}}':   data.viciiCunoscute  || '—',
    '{{PRET_MINIM}}':        data.pretMinim       != null ? String(data.pretMinim)       : '______',
    '{{CLARIFICARI}}':       data.clarificari     || '—',
    '{{CHELTUIELI_LUNARE}}': data.cheltuieliLunare != null ? String(data.cheltuieliLunare) : '______',

    // Dates / metadata
    '{{DATA_SEMNARII}}':     today,
    '{{DATA_SEMNARE}}':      today,
    '{{NR_CONTRACT}}':       '___',
    '{{DEROGARI}}':          data.derogari || '—',
  }

  let result = text
  for (const [placeholder, value] of Object.entries(map)) {
    result = result.split(placeholder).join(value)
  }

  // Remove "Locul semnării: ..." segment from the header line (user requested removal)
  result = result.replace(/\s*Locul semnării:\s*[^\n]*/gi, '')

  return result
}

export default function ContractPreviewContent({
  data,
  agentName,
  showSignatures,
  clientSignature,
  agentSignature,
  onTextReady,
}: Props) {
  const [contractText, setContractText] = useState<string | null>(null)
  const [error, setError] = useState(false)

  const tipContract = data.tipContract
  const fileUrl = tipContract ? CONTRACT_FILE[tipContract] : null

  useEffect(() => {
    if (!fileUrl) {
      setContractText(null)
      return
    }
    setError(false)
    setContractText(null)
    fetch(fileUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((text) => {
        const processed = applyPlaceholders(text, data)
        setContractText(processed)
        onTextReady?.(processed)
      })
      .catch(() => setError(true))
  // Re-run whenever any wizard data that feeds placeholders changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, data.clientData, data.clientData2, data.propertyData, data.durata, data.dataIncepere, data.comision, data.viciiCunoscute, data.pretMinim, data.clarificari, data.cheltuieliLunare, data.derogari])

  const today = new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
  const client = data.clientData

  if (!fileUrl) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm">
        Selectați tipul de contract pentru a previzualiza.
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 text-sm">
        Nu s-a putut încărca șablonul de contract ({fileUrl}).
        <br />
        <span className="text-gray-400">Asigurați-vă că fișierul există în /public{fileUrl}</span>
      </div>
    )
  }

  if (!contractText) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm animate-pulse">
        Se încarcă contractul…
      </div>
    )
  }

  // Split into lines, then group consecutive non-empty lines into paragraphs
  // separated by blank lines. This lets the browser reflow text naturally
  // (no whitespace:pre-wrap) while still preserving the logical block structure.
  type Block = { lines: string[]; isBlank: false } | { lines: []; isBlank: true }
  const blocks: { lines: string[]; idx: number }[] = []
  let current: string[] = []
  for (const line of contractText.split('\n')) {
    if (line.trim() === '') {
      if (current.length) { blocks.push({ lines: current, idx: blocks.length }); current = [] }
    } else {
      current.push(line)
    }
  }
  if (current.length) blocks.push({ lines: current, idx: blocks.length })

  const isArticleHeader = (lines: string[]) => /^(Art\.|ART\.)/.test(lines[0]?.trim() ?? '')
  const isDocHeader     = (idx: number)     => idx === 0

  return (
    <div className="contract-preview font-serif text-gray-900">
      {/* Contract body — full width, justified, browser reflows text naturally */}
      <div className="w-full mb-10" style={{ paddingLeft: 24, paddingRight: 24 }}>
        {blocks.map(({ lines, idx }) => {
          const artHeader = isArticleHeader(lines)
          const docHeader = isDocHeader(idx)
          return (
            <p
              key={idx}
              style={{
                textAlign: docHeader ? 'center' : 'justify',
                fontWeight: docHeader || artHeader ? 600 : 400,
                lineHeight: 1.6,
                fontSize: 13,
                marginTop: artHeader ? 16 : 0,
                marginBottom: 8,
              }}
            >
              {lines.map((line, li) => (
                <span key={li}>
                  {line}
                  {li < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
          )
        })}
      </div>

      {/* Signatures */}
      <div className="mt-10 grid grid-cols-2 gap-8 border-t border-gray-200 pt-8">
        <div>
          <p className="font-bold text-center mb-2">AGENT</p>
          <p className="text-center text-xs text-gray-500 mb-4">{agentName || 'HOME CAPITAL PARTNERS SRL'}</p>
          {showSignatures && agentSignature ? (
            <div className="border border-gray-300 rounded h-20 flex items-center justify-center">
              <img src={agentSignature} alt="Semnatura agent" className="max-h-16 max-w-full" />
            </div>
          ) : (
            <div className="border-b-2 border-gray-400 mt-12" />
          )}
          <p className="text-center text-xs text-gray-400 mt-1">Data: {today}</p>
        </div>

        <div>
          <p className="font-bold text-center mb-2">CLIENT</p>
          <p className="text-center text-xs text-gray-500 mb-4">
            {client?.prenume} {client?.nume}
          </p>
          {showSignatures && clientSignature ? (
            <div className="border border-gray-300 rounded h-20 flex items-center justify-center">
              <img src={clientSignature} alt="Semnatura client" className="max-h-16 max-w-full" />
            </div>
          ) : (
            <div className="border-b-2 border-gray-400 mt-12" />
          )}
          <p className="text-center text-xs text-gray-400 mt-1">Data: {today}</p>
        </div>
      </div>
    </div>
  )
}
