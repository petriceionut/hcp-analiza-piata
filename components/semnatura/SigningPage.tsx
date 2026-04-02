'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Contract } from '@/types'
import ContractPreviewContent from '../contracte/ContractPreviewContent'
import { WizardData } from '../contracte/ContractWizard'
import { CheckCircle, RotateCcw, PenLine, Loader2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  contract: Contract
  token: string
  signerType: 'client' | 'agent'
}

export default function SigningPage({ contract, token, signerType }: Props) {
  const [signed, setSigned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const sigCanvasRef = useRef<SignatureCanvas>(null)

  const wizardData: WizardData = {
    tipContract: contract.tip_contract,
    clientData: contract.client_data,
    propertyData: contract.property_data,
    derogari: contract.derogari,
  }

  const handleClear = () => {
    sigCanvasRef.current?.clear()
  }

  const handleSign = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error('Va rugam sa semnati in campul de mai sus')
      return
    }

    if (!agreed) {
      toast.error('Trebuie sa acceptati termenii pentru a semna')
      return
    }

    const signatureDataUrl = sigCanvasRef.current.toDataURL('image/png')
    setSubmitting(true)

    try {
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signerType,
          signature: signatureDataUrl,
        }),
      })

      if (!res.ok) throw new Error()

      setSigned(true)
      toast.success('Contract semnat cu succes!')
    } catch {
      toast.error('Eroare la semnare. Va rugam incercati din nou.')
    } finally {
      setSubmitting(false)
    }
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Contract semnat!
          </h1>
          <p className="text-slate-600 mb-2">
            {signerType === 'client'
              ? 'Va multumim! Agentul va fi notificat pentru a semna si el contractul.'
              : 'Contractul a fost semnat de ambele parti si este acum finalizat!'}
          </p>
          {signerType === 'client' && (
            <p className="text-sm text-slate-400">
              Veti primi o copie a contractului semnat pe email dupa ce agentul semneaza.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm">HCP Imobiliare</h1>
            <p className="text-xs text-slate-500">Semnatura digitala securizata</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <PenLine className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {signerType === 'client'
                ? `Buna ziua, ${contract.client_data?.prenume} ${contract.client_data?.nume}!`
                : 'Semnatura agent'}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {signerType === 'client'
                ? 'Va rugam cititi cu atentie contractul de mai jos, apoi semnati in campul dedicat.'
                : `Clientul ${contract.client_data?.prenume} ${contract.client_data?.nume} a semnat contractul. Va rugam semnati si dvs. pentru a finaliza.`}
            </p>
          </div>
        </div>

        {/* Contract preview */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
          <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-700">Contract pentru semnare</h3>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            <ContractPreviewContent
              data={wizardData}
              showSignatures={signerType === 'agent'}
              clientSignature={contract.client_semnatura}
            />
          </div>
        </div>

        {/* Signature area */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
          <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Semnatura {signerType === 'client' ? 'dumneavoastra' : 'agentului'}
            </h3>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sterge
            </button>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-400 mb-3 text-center">
              Semnati in spatiul de mai jos folosind mouse-ul sau degetul (pe mobil)
            </p>
            <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{
                  className: 'w-full',
                  style: { height: '180px', display: 'block' },
                }}
                backgroundColor="rgb(249, 250, 251)"
                penColor="#1e293b"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Semnatura va fi inregistrata cu marca temporala {new Date().toLocaleString('ro-RO')}
            </p>
          </div>
        </div>

        {/* Agreement checkbox */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-sm text-slate-600">
              Confirm ca am citit, am inteles si sunt de acord cu toate clauzele prezentului contract.
              Semnatura digitala aplicata are aceeasi valoare juridica cu semnatura olografa.
            </span>
          </label>
        </div>

        {/* Sign button */}
        <button
          onClick={handleSign}
          disabled={submitting || !agreed}
          className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-base font-semibold transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Se semneaza...
            </>
          ) : (
            <>
              <PenLine className="w-5 h-5" />
              Semneaza contractul
            </>
          )}
        </button>
      </div>
    </div>
  )
}
