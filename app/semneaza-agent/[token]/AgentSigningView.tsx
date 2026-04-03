'use client'

import { useState } from 'react'
import { CheckCircle, Download, FileText, Loader2, PenLine, Shield, User } from 'lucide-react'

interface SignedBlock {
  name: string
  email: string
  telefon: string
  ip: string
  device: string
  signedAt: string
}

interface Props {
  token: string
  contractText: string
  clientSignedBlock: SignedBlock | null
  agentName: string
  agentEmail: string
  agentIp: string
  agentDevice: string
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Europe/Bucharest',
  })
}

function SignatureBlockDisplay({ block, label }: { block: SignedBlock; label: string }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5" />
        {label} — semnat
      </p>
      <div className="border-t border-dashed border-green-300 mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs font-mono text-gray-700">
        <div><span className="text-gray-400">Semnat de:</span> <span className="font-semibold">{block.name}</span></div>
        <div><span className="text-gray-400">Email:</span> {block.email}</div>
        {block.telefon && <div><span className="text-gray-400">Telefon:</span> {block.telefon}</div>}
        <div><span className="text-gray-400">IP:</span> {block.ip}</div>
        <div className="sm:col-span-2"><span className="text-gray-400">Dispozitiv:</span> {block.device}</div>
        <div><span className="text-gray-400">Data și ora:</span> {block.signedAt}</div>
      </div>
      <div className="border-t border-dashed border-green-300 mt-3" />
    </div>
  )
}

export default function AgentSigningView({
  token,
  contractText,
  clientSignedBlock,
  agentName,
  agentEmail,
  agentIp,
  agentDevice,
}: Props) {
  const [loading, setLoading]   = useState(false)
  const [pdfUrl, setPdfUrl]     = useState<string | null>(null)
  const [error, setError]       = useState('')
  const signedAt = formatDateTime(new Date())

  const handleSign = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/semneaza-agent/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceInfo: agentDevice }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Eroare ${res.status}`)
      setPdfUrl(data.pdfUrl ?? '')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'A apărut o eroare. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  if (pdfUrl !== null && pdfUrl !== undefined && loading === false && error === '') {
    if (pdfUrl !== '') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Contract semnat complet!</h1>
            <p className="text-slate-500 mb-8">
              Ambele semnături au fost înregistrate. Clientul a primit PDF-ul final pe email.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              <Download className="w-5 h-5" />
              Descarcă PDF final
            </a>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Semnare agent</h1>
          <p className="text-slate-500 mt-1 text-sm">Contractul a fost semnat de client. Este rândul dvs. să semnați.</p>
        </div>

        {/* Client already signed block */}
        {clientSignedBlock && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Semnătură client</span>
            </div>
            <SignatureBlockDisplay block={clientSignedBlock} label="Client" />
          </div>
        )}

        {/* Contract text */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Contract</span>
          </div>
          <div
            style={{
              padding: '2.5cm',
              fontSize: '11pt',
              lineHeight: '1.4',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#000',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '55vh',
              overflowY: 'auto',
            }}
          >
            {contractText}
          </div>
        </div>

        {/* Agent signature block */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Semnătură electronică — Agent</span>
          </div>
          <div className="px-6 py-5">
            <div className="border-t-2 border-dashed border-gray-300 mb-5" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm font-mono">
              <div>
                <span className="text-gray-400">Semnat electronic de:</span>
                <span className="ml-2 text-gray-900 font-semibold">{agentName}</span>
              </div>
              <div>
                <span className="text-gray-400">Email:</span>
                <span className="ml-2 text-gray-900">{agentEmail}</span>
              </div>
              <div>
                <span className="text-gray-400">Adresa IP:</span>
                <span className="ml-2 text-gray-900">{agentIp}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-400">Dispozitiv:</span>
                <span className="ml-2 text-gray-900">{agentDevice}</span>
              </div>
              <div>
                <span className="text-gray-400">Data și ora:</span>
                <span className="ml-2 text-gray-900">{signedAt}</span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-300 mt-5 mb-6" />

            <p className="text-xs text-slate-400 mb-6">
              Prin apăsarea butonului de mai jos, confirmați semnătura electronică a contractului în calitate de agent imobiliar autorizat.
            </p>

            {error && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              onClick={handleSign}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-base"
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
