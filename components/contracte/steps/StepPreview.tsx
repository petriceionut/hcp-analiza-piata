'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WizardData } from '../ContractWizard'
import { CONTRACT_TYPES, PROPERTY_TYPES } from '@/lib/utils'
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Mail,
  Loader2,
  CheckCircle,
  Eye,
} from 'lucide-react'
import ContractPreviewContent from '../ContractPreviewContent'
import toast from 'react-hot-toast'

interface Props {
  data: WizardData
  onBack: () => void
}

type SendMethod = 'email' | 'whatsapp' | null

export default function StepPreview({ data, onBack }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [contractId, setContractId] = useState<string | null>(null)
  const [sendMethod, setSendMethod] = useState<SendMethod>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Save failed')

      const { id } = await res.json()
      setContractId(id)
      setSaved(true)
      toast.success('Contract salvat cu succes!')
    } catch {
      toast.error('Eroare la salvarea contractului')
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async (method: SendMethod) => {
    if (!contractId || !method) return
    setSendMethod(method)
    setSending(true)

    try {
      const res = await fetch(`/api/contracts/${contractId}/trimite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      })

      if (!res.ok) throw new Error('Send failed')

      setSent(true)
      toast.success(
        method === 'email'
          ? `Email trimis la ${data.clientData?.email}`
          : `WhatsApp trimis la ${data.clientData?.telefon}`
      )

      setTimeout(() => router.push('/contracte'), 2000)
    } catch {
      toast.error('Eroare la trimiterea contractului')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Eye className="w-5 h-5 text-blue-600" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Preview contract</h2>
          <p className="text-sm text-slate-500">Verifica contractul inainte de a-l trimite</p>
        </div>
      </div>

      {/* Contract preview */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-gray-500 ml-2">
            {data.tipContract && CONTRACT_TYPES[data.tipContract]}
          </span>
        </div>
        <div className="max-h-96 overflow-y-auto p-6 bg-white">
          <ContractPreviewContent data={data} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Client</p>
          <p className="text-sm font-semibold text-gray-900">
            {data.clientData?.prenume} {data.clientData?.nume}
          </p>
          <p className="text-xs text-gray-500">{data.clientData?.telefon}</p>
          <p className="text-xs text-gray-500">{data.clientData?.email}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Proprietate</p>
          <p className="text-sm font-semibold text-gray-900">
            {data.propertyData?.tip_proprietate && PROPERTY_TYPES[data.propertyData.tip_proprietate]}
          </p>
          <p className="text-xs text-gray-500 truncate">{data.propertyData?.adresa}</p>
        </div>
      </div>

      {/* Actions */}
      {!saved ? (
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Inapoi
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Se salveaza...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Salveaza si trimite
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="fade-in">
          {!sent ? (
            <>
              <div className="flex items-center gap-2 mb-4 text-green-600 bg-green-50 rounded-lg p-3">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Contract salvat! Alege cum trimiti clientului:</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Email */}
                <button
                  onClick={() => handleSend('email')}
                  disabled={sending}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
                    {sending && sendMethod === 'email' ? (
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    ) : (
                      <Mail className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">Email</p>
                    <p className="text-xs text-gray-500 break-all">{data.clientData?.email}</p>
                  </div>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => handleSend('whatsapp')}
                  disabled={sending}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 rounded-xl transition-all group"
                >
                  <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition-colors">
                    {sending && sendMethod === 'whatsapp' ? (
                      <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                    ) : (
                      <MessageCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                    <p className="text-xs text-gray-500">{data.clientData?.telefon}</p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">Contract trimis cu succes!</p>
              <p className="text-sm text-gray-500 mt-1">
                Clientul va primi un link pentru a semna contractul
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
