'use client'

import { useState } from 'react'
import { Contract } from '@/types'
import { PROPERTY_TYPES } from '@/lib/utils'
import { Mail, MessageCircle, Download, Eye, Loader2 } from 'lucide-react'
import ContractPreviewContent from './ContractPreviewContent'
import { WizardData } from './ContractWizard'
import toast from 'react-hot-toast'

interface Props {
  contract: Contract
}

export default function ContractDetailClient({ contract }: Props) {
  const [showPreview, setShowPreview] = useState(false)
  const [resending, setResending] = useState(false)

  const wizardData: WizardData = {
    tipContract: contract.tip_contract,
    clientData: contract.client_data,
    propertyData: contract.property_data,
    derogari: contract.derogari,
  }

  const handleResend = async (method: 'email' | 'whatsapp') => {
    setResending(true)
    try {
      const res = await fetch(`/api/contracts/${contract.id}/trimite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      })
      if (!res.ok) throw new Error()
      toast.success(
        method === 'email'
          ? `Link trimis pe email la ${contract.client_data?.email}`
          : `Link trimis pe WhatsApp la ${contract.client_data?.telefon}`
      )
    } catch {
      toast.error('Eroare la trimitere')
    } finally {
      setResending(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/contracts/${contract.id}/pdf`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contract-${contract.id}.pdf`
      a.click()
    } catch {
      toast.error('Eroare la generarea PDF-ului')
    }
  }

  return (
    <div className="space-y-6">
      {/* Client info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Date client</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Nume', value: `${contract.client_data?.prenume} ${contract.client_data?.nume}` },
            { label: 'CNP', value: contract.client_data?.cnp },
            { label: 'Buletin', value: `${contract.client_data?.serie_buletin} ${contract.client_data?.nr_buletin}` },
            { label: 'Adresa', value: contract.client_data?.adresa_domiciliu },
            { label: 'Telefon', value: contract.client_data?.telefon },
            { label: 'Email', value: contract.client_data?.email },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
              <p className="text-sm font-medium text-slate-800 break-all">{item.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Property info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Date imobil</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Tip', value: contract.property_data?.tip_proprietate && PROPERTY_TYPES[contract.property_data.tip_proprietate] },
            { label: 'Adresa', value: contract.property_data?.adresa },
            { label: 'Nr. cadastral', value: contract.property_data?.nr_cadastral },
            { label: 'Carte funciara', value: contract.property_data?.nr_carte_funciara },
            { label: 'Suprafata construita', value: contract.property_data?.suprafata_construita ? `${contract.property_data.suprafata_construita} mp` : null },
            { label: 'Suprafata utila', value: contract.property_data?.suprafata_utila ? `${contract.property_data.suprafata_utila} mp` : null },
          ].map((item) => item.value ? (
            <div key={item.label}>
              <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
              <p className="text-sm font-medium text-slate-800">{item.value}</p>
            </div>
          ) : null)}
        </div>
      </div>

      {/* Actions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Actiuni</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Ascunde preview' : 'Preview contract'}
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Descarca PDF
          </button>

          {contract.status !== 'semnat_ambele' && contract.status !== 'finalizat' && (
            <>
              <button
                onClick={() => handleResend('email')}
                disabled={resending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Retrimite email
              </button>

              <button
                onClick={() => handleResend('whatsapp')}
                disabled={resending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Retrimite WhatsApp
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contract preview */}
      {showPreview && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Preview contract</h3>
          <div className="border border-gray-200 rounded-xl p-6 max-h-[600px] overflow-y-auto">
            <ContractPreviewContent
              data={wizardData}
              showSignatures={contract.status === 'semnat_ambele' || contract.status === 'finalizat'}
              clientSignature={contract.client_semnatura}
              agentSignature={contract.agent_semnatura}
            />
          </div>
        </div>
      )}
    </div>
  )
}
