'use client'

import { useState } from 'react'
import { CheckCircle, Download, FileText, Loader2, PenLine, Shield } from 'lucide-react'

interface Props {
  token: string
  contractText: string
  clientName: string
  clientEmail: string
  telefon: string
  ip: string
  device: string
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Bucharest',
  })
}

export default function ClientSigningView({
  token,
  contractText,
  clientName,
  clientEmail,
  telefon,
  ip,
  device,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const signedAt = formatDateTime(new Date())

  const handleSign = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/semneaza/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceInfo: device }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Eroare ${res.status}`)
      setPdfUrl(data.pdfUrl ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'A apărut o eroare. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  if (pdfUrl !== null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Contract semnat cu succes!</h1>
          <p className="text-slate-500 mb-8">
            Semnătura dvs. electronică a fost înregistrată. Agentul va fi notificat și va semna la rândul său.
          </p>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              <Download className="w-5 h-5" />
              Descarcă PDF semnat
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Semnare document electronic</h1>
          <p className="text-slate-500 mt-1 text-sm">Citiți cu atenție documentul, apoi semnați mai jos</p>
        </div>

        {/* Contract text */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Contract</span>
          </div>
          <div
            style={{
              padding: '32px 16px',
              fontSize: '16px',
              lineHeight: '1.7',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#111',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '70vh',
              overflowY: 'auto',
              textAlign: 'left',
            }}
          >
            {contractText.replace(/\bNaN\b/g, '______')}
          </div>
        </div>

        {/* Signature block */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Bloc semnătură electronică</span>
          </div>

          <div className="px-6 py-5">
            {/* Visual separator top */}
            <div className="border-t-2 border-dashed border-gray-300 mb-5" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm font-mono">
              <div>
                <span className="text-gray-400">Semnat electronic de:</span>
                <span className="ml-2 text-gray-900 font-semibold">{clientName}</span>
              </div>
              <div>
                <span className="text-gray-400">Email:</span>
                <span className="ml-2 text-gray-900">{clientEmail}</span>
              </div>
              {telefon && (
                <div>
                  <span className="text-gray-400">Telefon:</span>
                  <span className="ml-2 text-gray-900">{telefon}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400">Adresa IP:</span>
                <span className="ml-2 text-gray-900">{ip}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-400">Dispozitiv:</span>
                <span className="ml-2 text-gray-900">{device}</span>
              </div>
              <div>
                <span className="text-gray-400">Data și ora:</span>
                <span className="ml-2 text-gray-900">{signedAt}</span>
              </div>
            </div>

            {/* Visual separator bottom */}
            <div className="border-t-2 border-dashed border-gray-300 mt-5 mb-6" />

            <p className="text-xs text-slate-400 mb-6">
              Prin apăsarea butonului de mai jos, confirmați că ați citit și sunteți de acord cu toate clauzele
              contractului. Semnătura electronică are valoare juridică conform Regulamentului eIDAS.
            </p>

            {error && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              onClick={handleSign}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Se înregistrează semnătura...
                </>
              ) : (
                <>
                  <PenLine className="w-5 h-5" />
                  Semnez documentul
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
