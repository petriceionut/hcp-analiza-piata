'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Contract, ContractType } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { CONTRACT_TYPES, PROPERTY_TYPES, formatDate } from '@/lib/utils'
import { CheckCircle, RotateCcw, PenLine, Loader2, FileText, User, Home } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  contract: Contract
  token: string
  signerType: 'client' | 'agent'
}

export default function SigningPage({ contract, token, signerType }: Props) {
  const sigCanvasRef = useRef<SignatureCanvas>(null)
  const [loading, setLoading] = useState(false)
  const [signed, setSigned] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const displayName =
    signerType === 'client'
      ? `${contract.client_data?.prenume} ${contract.client_data?.nume}`
      : 'Agent Imobiliar'

  const clearSignature = () => {
    sigCanvasRef.current?.clear()
  }

  const handleSign = async () => {
    if (!agreed) {
      toast.error('Trebuie să fii de acord cu termenii contractului.')
      return
    }
    if (sigCanvasRef.current?.isEmpty()) {
      toast.error('Te rugăm să semnezi în câmpul de mai jos.')
      return
    }

    const signatureDataUrl = sigCanvasRef.current?.toDataURL('image/png')
    if (!signatureDataUrl) {
      toast.error('Semnătura nu a putut fi capturată.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      const updates: Record<string, string> = {}

      if (signerType === 'client') {
        updates.client_semnatura = signatureDataUrl
        updates.client_semnat_la = now
        updates.status = 'semnat_client'
      } else {
        updates.agent_semnatura = signatureDataUrl
        updates.agent_semnat_la = now
        updates.status = contract.client_semnat_la ? 'semnat_ambele' : contract.status
      }

      const { error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', contract.id)

      if (error) throw error

      setSigned(true)
      toast.success('Contract semnat cu succes!')
    } catch (err) {
      console.error(err)
      toast.error('A apărut o eroare. Te rugăm să încerci din nou.')
    } finally {
      setLoading(false)
    }
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Contract semnat!</h1>
          <p className="text-slate-500 mb-6">
            Semnătura a fost înregistrată cu succes.{' '}
            {signerType === 'client'
              ? 'Agentul va fi notificat și va semna la rândul lui.'
              : 'Contractul este acum complet semnat de ambele părți.'}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left text-sm text-slate-600 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Data semnării</span>
              <span className="font-medium">{formatDate(new Date().toISOString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Semnat de</span>
              <span className="font-medium">{displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tip contract</span>
              <span className="font-medium text-right">
                {CONTRACT_TYPES[contract.tip_contract as ContractType]}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Semnare Contract</h1>
          <p className="text-slate-500 mt-1">
            {CONTRACT_TYPES[contract.tip_contract as ContractType]}
          </p>
        </div>

        {/* Contract Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Detalii contract
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 text-xs uppercase tracking-wide font-medium">
                  Client
                </span>
              </div>
              <p className="font-semibold text-slate-900">
                {contract.client_data?.prenume} {contract.client_data?.nume}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">{contract.client_data?.telefon}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 text-xs uppercase tracking-wide font-medium">
                  Proprietate
                </span>
              </div>
              <p className="font-semibold text-slate-900">
                {PROPERTY_TYPES[contract.property_data?.tip_proprietate]}
              </p>
              <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                {contract.property_data?.adresa}
              </p>
            </div>
          </div>

          {contract.derogari && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm">
              <p className="text-amber-700 font-medium mb-1">Derogări / Clauze speciale</p>
              <p className="text-amber-600">{contract.derogari}</p>
            </div>
          )}
        </div>

        {/* Signature Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Semnătura dvs.</h2>
            <button
              type="button"
              onClick={clearSignature}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Șterge
            </button>
          </div>

          <p className="text-sm text-slate-500 mb-4">
            Semnați în câmpul de mai jos folosind mouse-ul sau degetul.
          </p>

          <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50 hover:border-blue-300 transition-colors">
            <SignatureCanvas
              ref={sigCanvasRef}
              canvasProps={{
                className: 'w-full',
                style: { width: '100%', height: '180px', display: 'block' },
              }}
              backgroundColor="rgb(249, 250, 251)"
              penColor="#1e293b"
            />
          </div>

          <p className="text-xs text-slate-400 mt-2 text-center">
            Semnătura electronică a lui{' '}
            <span className="font-medium text-slate-600">{displayName}</span>
          </p>
        </div>

        {/* Agreement & Sign */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600">
              Am citit și înțeles termenii contractului{' '}
              <strong>{CONTRACT_TYPES[contract.tip_contract as ContractType]}</strong> și sunt de
              acord cu toate clauzele stipulate. Confirm că semnătura electronică de mai sus
              reprezintă consimțământul meu legal.
            </span>
          </label>

          <button
            onClick={handleSign}
            disabled={loading || !agreed}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Se salvează semnătura...
              </>
            ) : (
              <>
                <PenLine className="w-5 h-5" />
                Semnează contractul
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
