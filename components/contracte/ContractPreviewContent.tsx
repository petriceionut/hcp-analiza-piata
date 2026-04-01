'use client'

import { useEffect, useState } from 'react'
import { WizardData } from './ContractWizard'

interface Props {
  data: WizardData
  agentName?: string
  agentTel?: string
  agentEmail?: string
  showSignatures?: boolean
  clientSignature?: string
  agentSignature?: string
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

function applyPlaceholders(text: string, data: WizardData, agentName?: string, agentTel?: string, agentEmail?: string): string {
  const client = data.clientData ?? {}
  const property = data.propertyData ?? {}
  const today = new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })

  const map: Record<string, string> = {
    '{{NUME_CLIENT}}':      client.nume           ?? '______',
    '{{PRENUME_CLIENT}}':   client.prenume        ?? '______',
    '{{CNP}}':              client.cnp            ?? '______',
    '{{SERIE_BULETIN}}':    client.serie_buletin  ?? '______',
    '{{NR_BULETIN}}':       client.nr_buletin     ?? '______',
    '{{ADRESA_CLIENT}}':    client.adresa_domiciliu ?? '______',
    '{{JUDET_SECTOR}}':     '______',
    '{{TEL_CLIENT}}':       client.telefon        ?? '______',
    '{{EMAIL_CLIENT}}':     client.email          ?? '______',
    '{{ADRESA_IMOBIL}}':    property.adresa       ?? '______',
    '{{DESCRIERE_IMOBIL}}': property.adresa       ?? '______',
    '{{NR_CF}}':            property.nr_carte_funciara ?? '______',
    '{{NR_CADASTRAL}}':     property.nr_cadastral ?? '______',
    '{{COMISION}}':         data.comision != null  ? String(data.comision) : '____',
    '{{DURATA}}':           data.durata   != null  ? String(data.durata)   : '__',
    '{{DATA_EXPIRARE}}':    data.durata   != null  ? computeExpiryDate(data.durata) : '______',
    '{{DATA_SEMNARII}}':    today,
    '{{DATA_SEMNARE}}':     today,
    '{{NR_CONTRACT}}':      '___',
    '{{LOC_SEMNARE}}':      'București',
    '{{AGENT_NUME}}':       agentName  ?? '______',
    '{{AGENT_TEL}}':        agentTel   ?? '______',
    '{{AGENT_EMAIL}}':      agentEmail ?? '______',
    '{{DEROGARI}}':         data.derogari || '—',
  }

  let result = text
  for (const [placeholder, value] of Object.entries(map)) {
    result = result.split(placeholder).join(value)
  }
  return result
}

export default function ContractPreviewContent({
  data,
  agentName,
  agentTel,
  agentEmail,
  showSignatures,
  clientSignature,
  agentSignature,
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
      .then((text) => setContractText(applyPlaceholders(text, data, agentName, agentTel, agentEmail)))
      .catch(() => setError(true))
  // Re-run whenever any wizard data that feeds placeholders changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, data.clientData, data.propertyData, data.durata, data.comision, data.derogari, agentName, agentTel, agentEmail])

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

  return (
    <div className="contract-preview font-serif text-sm leading-relaxed">
      {/* Contract body — whitespace preserved to match the source text file */}
      <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-900 mb-10">
        {contractText}
      </pre>

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
