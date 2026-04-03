'use client'

import { useState } from 'react'
import { CheckCircle, PenLine, Loader2 } from 'lucide-react'

interface Props {
  token: string
  clientName: string
  contractText: string
}

export default function SignatureRequestPage({ token, clientName, contractText }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState('')

  const handleSign = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Te rugăm să introduci numele complet.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/semneaza/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerName: trimmedName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Eroare ${res.status}`)
      }
      setSigned(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'A apărut o eroare. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Document semnat!</h1>
          <p className="text-slate-500">
            Semnătura ta a fost înregistrată. Vei primi o confirmare pe email.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Semnare document</h1>
          <p className="text-slate-500 mt-1">
            Citiți documentul cu atenție, apoi semnați mai jos.
          </p>
        </div>

        {/* Contract text */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="contract-text"
            style={{
              padding: '2.5cm',
              fontSize: '11pt',
              lineHeight: '1.4',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#000',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {contractText}
          </div>
        </div>

        {/* Signature block */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900">Semnătura electronică</h2>
          <p className="text-sm text-slate-500">
            Prin introducerea numelui complet mai jos și apăsarea butonului, confirmați că ați citit
            documentul și sunteți de acord cu toate clauzele sale. Această acțiune are valoare
            de semnătură electronică.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nume complet *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSign()}
              placeholder={clientName}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <button
            onClick={handleSign}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Se înregistrează...
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
  )
}
