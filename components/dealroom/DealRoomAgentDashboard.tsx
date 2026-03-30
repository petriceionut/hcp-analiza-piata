'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DealRoom, DealRoomDocument, Buyer, Offer, OfferStatus } from '@/types'
import { formatCurrency, formatDateTime, generateToken } from '@/lib/utils'
import {
  Upload,
  Loader2,
  Trash2,
  Copy,
  Check,
  UserPlus,
  FileText,
  Users,
  TrendingUp,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  dealroom: DealRoom
  documente: DealRoomDocument[]
  cumparatori: Buyer[]
  oferte: (Offer & { buyer: { nume: string; prenume: string } })[]
}

type Tab = 'documente' | 'cumparatori' | 'oferte'

const offerStatusConfig: Record<
  OfferStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  in_asteptare: {
    label: 'În așteptare',
    color: 'bg-amber-100 text-amber-700',
    icon: <Clock className="w-3 h-3" />,
  },
  acceptata: {
    label: 'Acceptată',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  respinsa: {
    label: 'Respinsă',
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="w-3 h-3" />,
  },
}

export default function DealRoomAgentDashboard({
  dealroom,
  documente: initialDocumente,
  cumparatori: initialCumparatori,
  oferte: initialOferte,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('documente')
  const [documente, setDocumente] = useState(initialDocumente)
  const [cumparatori, setCumparatori] = useState(initialCumparatori)
  const [oferte, setOferte] = useState(initialOferte)

  // Document upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Add buyer form
  const [showAddBuyer, setShowAddBuyer] = useState(false)
  const [buyerNume, setBuyerNume] = useState('')
  const [buyerPrenume, setBuyerPrenume] = useState('')
  const [buyerTelefon, setBuyerTelefon] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [addingBuyer, setAddingBuyer] = useState(false)

  // Copied state per token
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Offer actions
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null)

  const supabase = createClient()
  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? ''

  // ─── Documents ────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    try {
      const filePath = `dealroom/${dealroom.id}/${Date.now()}_${file.name}`

      const { error: storageError } = await supabase.storage
        .from('dealroom-docs')
        .upload(filePath, file)

      if (storageError) throw storageError

      const { data: urlData } = supabase.storage
        .from('dealroom-docs')
        .getPublicUrl(filePath)

      const { data: doc, error: dbError } = await supabase
        .from('dealroom_documents')
        .insert({
          dealroom_id: dealroom.id,
          nume: file.name,
          url: urlData.publicUrl,
          tip: file.type,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setDocumente((prev) => [doc as DealRoomDocument, ...prev])
      toast.success('Document încărcat cu succes!')
    } catch (err) {
      console.error(err)
      toast.error('Eroare la încărcarea documentului.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (doc: DealRoomDocument) => {
    if (!confirm(`Ștergi documentul "${doc.nume}"?`)) return

    try {
      const { error } = await supabase
        .from('dealroom_documents')
        .delete()
        .eq('id', doc.id)

      if (error) throw error

      setDocumente((prev) => prev.filter((d) => d.id !== doc.id))
      toast.success('Document șters.')
    } catch {
      toast.error('Eroare la ștergere.')
    }
  }

  // ─── Buyers ───────────────────────────────────────────────────────────────

  const handleAddBuyer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyerNume || !buyerPrenume || !buyerTelefon) {
      toast.error('Completați toate câmpurile obligatorii.')
      return
    }

    setAddingBuyer(true)
    try {
      const token = generateToken()

      const { data: buyer, error } = await supabase
        .from('buyers')
        .insert({
          dealroom_id: dealroom.id,
          nume: buyerNume,
          prenume: buyerPrenume,
          telefon: buyerTelefon,
          email: buyerEmail || null,
          token,
        })
        .select()
        .single()

      if (error) throw error

      setCumparatori((prev) => [buyer as Buyer, ...prev])
      setBuyerNume('')
      setBuyerPrenume('')
      setBuyerTelefon('')
      setBuyerEmail('')
      setShowAddBuyer(false)
      toast.success('Cumpărător adăugat!')
    } catch {
      toast.error('Eroare la adăugarea cumpărătorului.')
    } finally {
      setAddingBuyer(false)
    }
  }

  const copyInviteLink = async (token: string) => {
    const link = `${appUrl}/dealroom-client/${token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(token)
    toast.success('Link copiat!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDeleteBuyer = async (buyer: Buyer) => {
    if (!confirm(`Ștergi cumpărătorul ${buyer.prenume} ${buyer.nume}?`)) return

    try {
      const { error } = await supabase.from('buyers').delete().eq('id', buyer.id)
      if (error) throw error
      setCumparatori((prev) => prev.filter((b) => b.id !== buyer.id))
      toast.success('Cumpărător șters.')
    } catch {
      toast.error('Eroare la ștergere.')
    }
  }

  // ─── Offers ───────────────────────────────────────────────────────────────

  const handleOfferAction = async (offerId: string, action: 'acceptata' | 'respinsa') => {
    setProcessingOfferId(offerId)
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: action })
        .eq('id', offerId)

      if (error) throw error

      setOferte((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: action } : o))
      )

      if (action === 'acceptata') {
        // Update dealroom status
        await supabase
          .from('dealrooms')
          .update({ status: 'oferta_acceptata' })
          .eq('id', dealroom.id)

        toast.success('Ofertă acceptată! DealRoom marcat ca finalizat.')
      } else {
        toast.success('Ofertă respinsă.')
      }
    } catch {
      toast.error('Eroare la procesarea ofertei.')
    } finally {
      setProcessingOfferId(null)
    }
  }

  // ─── Tabs ─────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: 'documente',
      label: 'Documente',
      count: documente.length,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'cumparatori',
      label: 'Cumpărători',
      count: cumparatori.length,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'oferte',
      label: 'Oferte',
      count: oferte.length,
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-blue-200 transition-all"
          >
            <div className="flex items-center gap-2 text-slate-400 mb-2">{tab.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{tab.count}</p>
            <p className="text-sm text-slate-500">{tab.label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Documents Tab ── */}
          {activeTab === 'documente' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Documentele sunt vizibile tuturor cumpărătorilor invitați.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? 'Se încarcă...' : 'Adaugă document'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {documente.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Niciun document încărcat</p>
                  <p className="text-xs mt-1">
                    Adaugă documente pentru a le face disponibile cumpărătorilor
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documente.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{doc.nume}</p>
                          <p className="text-xs text-slate-400">
                            {formatDateTime(doc.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Buyers Tab ── */}
          {activeTab === 'cumparatori' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Fiecare cumpărător primește un link unic de acces.
                </p>
                <button
                  onClick={() => setShowAddBuyer(!showAddBuyer)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Adaugă cumpărător
                </button>
              </div>

              {showAddBuyer && (
                <form
                  onSubmit={handleAddBuyer}
                  className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3"
                >
                  <p className="text-sm font-semibold text-blue-700">Date cumpărător</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Prenume *</label>
                      <input
                        value={buyerPrenume}
                        onChange={(e) => setBuyerPrenume(e.target.value)}
                        className="input-field"
                        placeholder="Ion"
                      />
                    </div>
                    <div>
                      <label className="label">Nume *</label>
                      <input
                        value={buyerNume}
                        onChange={(e) => setBuyerNume(e.target.value)}
                        className="input-field"
                        placeholder="Popescu"
                      />
                    </div>
                    <div>
                      <label className="label">Telefon *</label>
                      <input
                        value={buyerTelefon}
                        onChange={(e) => setBuyerTelefon(e.target.value)}
                        className="input-field"
                        placeholder="0721234567"
                        type="tel"
                      />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="input-field"
                        placeholder="email@exemplu.ro"
                        type="email"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddBuyer(false)}
                      className="btn-secondary text-sm"
                    >
                      Anulează
                    </button>
                    <button
                      type="submit"
                      disabled={addingBuyer}
                      className="btn-primary text-sm"
                    >
                      {addingBuyer ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      Salvează
                    </button>
                  </div>
                </form>
              )}

              {cumparatori.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Niciun cumpărător adăugat</p>
                  <p className="text-xs mt-1">
                    Adaugă cumpărători pentru a le trimite invitații
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cumparatori.map((buyer) => (
                    <div
                      key={buyer.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {buyer.prenume} {buyer.nume}
                        </p>
                        <p className="text-xs text-slate-400">{buyer.telefon}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => copyInviteLink(buyer.token)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
                          title="Copiază link de acces"
                        >
                          {copiedId === buyer.token ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Link
                        </button>
                        <a
                          href={`${appUrl}/dealroom-client/${buyer.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteBuyer(buyer)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Offers Tab ── */}
          {activeTab === 'oferte' && (
            <div className="space-y-4">
              {oferte.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nicio ofertă primită</p>
                  <p className="text-xs mt-1">
                    Ofertele vor apărea aici după ce cumpărătorii le trimit
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {oferte
                    .sort((a, b) => b.suma - a.suma)
                    .map((offer, index) => {
                      const statusCfg = offerStatusConfig[offer.status]
                      const isProcessing = processingOfferId === offer.id
                      const isPending = offer.status === 'in_asteptare'

                      return (
                        <div
                          key={offer.id}
                          className="p-4 bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                #{index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {formatCurrency(offer.suma)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {offer.buyer?.prenume} {offer.buyer?.nume} ·{' '}
                                  {formatDateTime(offer.created_at)}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`badge flex items-center gap-1 ${statusCfg.color}`}
                            >
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          </div>

                          {offer.mesaj && (
                            <p className="text-sm text-slate-600 mt-2 pl-11 italic">
                              "{offer.mesaj}"
                            </p>
                          )}

                          {isPending && (
                            <div className="flex gap-2 mt-3 pl-11">
                              <button
                                onClick={() => handleOfferAction(offer.id, 'acceptata')}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                Acceptă
                              </button>
                              <button
                                onClick={() => handleOfferAction(offer.id, 'respinsa')}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-600 rounded-lg font-medium transition-colors"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                Respinge
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
