'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WizardData } from '../ContractWizard'
import { CONTRACT_TYPES, PROPERTY_TYPES } from '@/lib/utils'
import {
  ArrowLeft,
  Send,
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

export default function StepPreview({ data, onBack }: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const contractTextRef = useRef<string>('')
  const previewRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleTextReady = (text: string) => {
    contractTextRef.current = text
  }

  const handleSaveAndSend = async () => {
    if (sending || sent) return
    setSending(true)

    try {
      // 1. Generate PDF from the rendered contract preview
      const [html2canvas, { jsPDF }] = await Promise.all([
        import('html2canvas').then((m) => m.default),
        import('jspdf'),
      ])

      if (!previewRef.current) throw new Error('Preview element not found')

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * pageWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const pdfBase64 = pdf.output('datauristring').split(',')[1]

      // 2. Save contract to Supabase
      const saveRes = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!saveRes.ok) {
        const saveErr = await saveRes.json().catch(() => ({ error: `HTTP ${saveRes.status}` }))
        console.error('[StepPreview] Save failed:', saveErr)
        throw new Error(saveErr?.detail ?? saveErr?.error ?? `Failed to save contract (${saveRes.status})`)
      }
      const { id: contractId } = await saveRes.json()

      // 3. Send to SignWell (generates signing link and emails client)
      const sendRes = await fetch(`/api/contracts/${contractId}/trimite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64 }),
      })

      if (!sendRes.ok) {
        const errData = await sendRes.json().catch(() => ({}))
        throw new Error(errData?.error ?? 'Failed to send contract')
      }

      setSent(true)
      toast.success(`Contractul a fost trimis la ${data.clientData?.email} pentru semnare`)

      setTimeout(() => router.push('/contracte'), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscuta'
      toast.error(`Eroare: ${message}`)
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
          <div ref={previewRef}>
            <ContractPreviewContent data={data} onTextReady={handleTextReady} />
          </div>
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
      {sent ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">Contract trimis cu succes!</p>
          <p className="text-sm text-gray-500 mt-1">
            Clientul va primi un email cu link pentru a semna contractul
          </p>
        </div>
      ) : (
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Inapoi
          </button>
          <button
            onClick={handleSaveAndSend}
            disabled={sending}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-all"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Se trimite…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Salveaza si trimite
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
