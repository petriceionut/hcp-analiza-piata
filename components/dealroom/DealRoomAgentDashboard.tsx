'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DealRoom, DealRoomDocument, Buyer, Offer, DealRoomClient, DocumentScanat } from '@/types'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import {
  Upload,
  UserPlus,
  FileText,
  Users,
  Euro,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  Copy,
  X,
  Download,
  ScanLine,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  dealroom: DealRoom
  documente: DealRoomDocument[]
  cumparatori: Buyer[]
  oferte: (Offer & { buyer: { nume: string; prenume: string } })[]
  clienti: DealRoomClient[]
  documenteScanate: DocumentScanat[]
}

type Tab = 'documente' | 'cumparatori' | 'oferte'

export default function DealRoomAgentDashboard({
  dealroom,
  documente: initialDocs,
  cumparatori: initialBuyers,
  oferte: initialOffers,
  clienti,
  documenteScanate,
}: Props) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('documente')
  const [docs, setDocs] = useState(initialDocs)
  const [buyers, setBuyers] = useState(initialBuyers)
  const [offers, setOffers] = useState(initialOffers)
  const [uploading, setUploading] = useState(false)
  const [showAddBuyer, setShowAddBuyer] = useState(false)
  const [buyerForm, setBuyerForm] = useState({ nume: '', prenume: '', telefon: '', email: '' })
  const [addingBuyer, setAddingBuyer] = useState(false)
  const [confirmingOffer, setConfirmingOffer] = useState<string | null>(null)

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dealroom_id', dealroom.id)

      const res = await fetch(`/api/dealroom/${dealroom.id}/documente`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error()

      const newDoc = await res.json()
      setDocs((prev) => [newDoc, ...prev])
      toast.success('Document incarcat cu succes!')
    } catch {
      toast.error('Eroare la incarcarea documentului')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleAddBuyer = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingBuyer(true)
    try {
      const res = await fetch(`/api/dealroom/${dealroom.id}/cumparatori`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buyerForm, dealroom_id: dealroom.id }),
      })

      if (!res.ok) throw new Error()

      const newBuyer = await res.json()
      setBuyers((prev) => [newBuyer, ...prev])
      setBuyerForm({ nume: '', prenume: '', telefon: '', email: '' })
      setShowAddBuyer(false)
      toast.success(`${buyerForm.prenume} ${buyerForm.nume} adaugat! Link trimis pe WhatsApp.`)
    } catch {
      toast.error('Eroare la adaugarea cumparatorului')
    } finally {
      setAddingBuyer(false)
    }
  }

  const handleConfirmOffer = async (offerId: string) => {
    setConfirmingOffer(offerId)
    try {
      const res = await fetch(`/api/dealroom/${dealroom.id}/oferte/${offerId}/confirma`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error()

      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId ? { ...o, status: 'acceptata' as const } : o
        )
      )
      toast.success('Oferta confirmata! DealRoom-ul a fost inchis.')
    } catch {
      toast.error('Eroare la confirmarea ofertei')
    } finally {
      setConfirmingOffer(null)
    }
  }

  const copyBuyerLink = (token: string) => {
    const url = `${window.location.origin}/dealroom-client/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiat!')
  }

  const tabs: { id: Tab; label: string; count: number; icon: React.ElementType }[] = [
    { id: 'documente', label: 'Documente', count: docs.length + documenteScanate.length, icon: FileText },
    { id: 'cumparatori', label: 'Cumparatori', count: buyers.length + clienti.length, icon: Users },
    { id: 'oferte', label: 'Oferte', count: offers.length, icon: Euro },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`badge text-xs px-1.5 py-0.5 ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Documents tab */}
      {activeTab === 'documente' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Documente proprietate</h2>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Se incarca...' : 'Incarca document'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleUploadDoc}
                disabled={uploading}
              />
            </label>
          </div>

          {docs.length === 0 && documenteScanate.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Niciun document incarcat</p>
              <p className="text-xs text-gray-400 mt-1">Incarca extras CF, schite, releveu, etc.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.nume}</p>
                    <p className="text-xs text-slate-400">{formatDate(doc.uploaded_at)}</p>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Deschide
                  </a>
                </div>
              ))}

              {documenteScanate.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ScanLine className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.file_name}</p>
                    <p className="text-xs text-slate-400">
                      {doc.nr_pagini} {doc.nr_pagini === 1 ? 'pagină' : 'pagini'} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <button
                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 transition-colors"
                    onClick={async () => {
                      // Extract storage path from stored URL
                      const path = doc.file_url.split('/documente-proprietati/')[1]
                      if (!path) { toast.error('URL invalid'); return }
                      const { data, error } = await supabase.storage
                        .from('documente-proprietati')
                        .createSignedUrl(path, 3600)
                      if (error || !data?.signedUrl) { toast.error('Nu se poate genera link-ul'); return }
                      window.open(data.signedUrl, '_blank')
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descarcă
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buyers tab */}
      {activeTab === 'cumparatori' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Cumparatori interesati</h2>
            <button
              onClick={() => setShowAddBuyer(true)}
              disabled={dealroom.status === 'inchis'}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Adauga cumparator
            </button>
          </div>

          {showAddBuyer && (
            <div className="bg-white rounded-xl border border-emerald-200 p-5 fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Cumparator nou</h3>
                <button onClick={() => setShowAddBuyer(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddBuyer} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prenume *</label>
                  <input required value={buyerForm.prenume} onChange={(e) => setBuyerForm((p) => ({ ...p, prenume: e.target.value }))} className="input-field" placeholder="Ion" />
                </div>
                <div>
                  <label className="label">Nume *</label>
                  <input required value={buyerForm.nume} onChange={(e) => setBuyerForm((p) => ({ ...p, nume: e.target.value }))} className="input-field" placeholder="Popescu" />
                </div>
                <div>
                  <label className="label">Telefon * (WhatsApp)</label>
                  <input required value={buyerForm.telefon} onChange={(e) => setBuyerForm((p) => ({ ...p, telefon: e.target.value }))} className="input-field" placeholder="0721234567" type="tel" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input value={buyerForm.email} onChange={(e) => setBuyerForm((p) => ({ ...p, email: e.target.value }))} className="input-field" placeholder="email@optional.com" type="email" />
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAddBuyer(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">Anuleaza</button>
                  <button type="submit" disabled={addingBuyer} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {addingBuyer ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Adauga si trimite link
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Clients added via "Adaugă client" modal */}
          {clienti.length > 0 && (
            <div className="space-y-2">
              {clienti.map((client) => (
                <div key={client.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-blue-600">
                    {client.prenume?.[0] ?? '?'}{client.nume?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{client.prenume} {client.nume}</p>
                    <p className="text-xs text-slate-500">{client.telefon}{client.email ? ` • ${client.email}` : ''}</p>
                    {(client.data_vizionare || client.ora_vizionare) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Vizionare: {client.data_vizionare ?? ''}{client.data_vizionare && client.ora_vizionare ? ' ' : ''}{client.ora_vizionare ?? ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {buyers.length === 0 && clienti.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Niciun cumparator adaugat</p>
            </div>
          ) : buyers.length > 0 ? (
            <div className="space-y-2">
              {buyers.map((buyer) => (
                <div key={buyer.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-emerald-600">
                    {buyer.prenume[0]}{buyer.nume[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{buyer.prenume} {buyer.nume}</p>
                    <p className="text-xs text-slate-400">{buyer.telefon}</p>
                  </div>
                  <button onClick={() => copyBuyerLink(buyer.token)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                    Copiaza link
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Offers tab */}
      {activeTab === 'oferte' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Oferte primite</h2>

          {offers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <Euro className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nicio oferta primita inca</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className={`bg-white rounded-xl border p-5 ${offer.status === 'acceptata' ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">{offer.buyer?.prenume} {offer.buyer?.nume}</p>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(offer.suma)}</p>
                      {offer.mesaj && <p className="text-sm text-slate-500 mt-1 italic">&quot;{offer.mesaj}&quot;</p>}
                      <p className="text-xs text-slate-400 mt-2">{formatDateTime(offer.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {offer.status === 'acceptata' ? (
                        <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Acceptata
                        </span>
                      ) : offer.status === 'in_asteptare' && dealroom.status !== 'inchis' ? (
                        <button
                          onClick={() => handleConfirmOffer(offer.id)}
                          disabled={confirmingOffer === offer.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {confirmingOffer === offer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Confirma oferta
                        </button>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          In asteptare
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
