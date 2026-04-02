'use client'

import { useState } from 'react'
import { DealRoom, DealRoomDocument, Buyer, Offer } from '@/types'
import { PROPERTY_ICONS, PROPERTY_TYPES, formatDate, formatCurrency } from '@/lib/utils'
import {
  FileText,
  Users,
  Euro,
  Send,
  ExternalLink,
  CheckCircle,
  Bell,
  Loader2,
  Building2,
  Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  buyer: Buyer
  dealroom: DealRoom
  documente: DealRoomDocument[]
  oferte: Offer[]
  buyerCount: number
  myOffer?: Offer
}

export default function BuyerDealRoomView({
  buyer,
  dealroom,
  documente,
  oferte,
  buyerCount,
  myOffer: initialMyOffer,
}: Props) {
  const [myOffer, setMyOffer] = useState(initialMyOffer)
  const [ofertaSum, setOfertaSum] = useState('')
  const [ofertaMessage, setOfertaMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const otherOffersCount = oferte.filter((o) => o.buyer_id !== buyer.id).length
  const isClosed = dealroom.status === 'inchis'
  const myOfferAccepted = myOffer && oferte.find((o) => o.id === myOffer.id && o.status === 'acceptata')

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ofertaSum || isNaN(Number(ofertaSum))) {
      toast.error('Introduceti o suma valida')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/dealroom-client/${buyer.token}/oferta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suma: Number(ofertaSum),
          mesaj: ofertaMessage,
        }),
      })

      if (!res.ok) throw new Error()

      const newOffer = await res.json()
      setMyOffer(newOffer)
      toast.success('Oferta trimisa cu succes!')
    } catch {
      toast.error('Eroare la trimiterea ofertei')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm">HCP DealRoom</h1>
            <p className="text-xs text-slate-500">Spatiu securizat de negociere</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{PROPERTY_ICONS[dealroom.tip_proprietate]}</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {PROPERTY_TYPES[dealroom.tip_proprietate]}
              </h2>
              <p className="text-slate-600 text-sm">{dealroom.adresa_scurta}</p>
              <p className="text-xs text-slate-400 mt-1">
                Buna ziua, {buyer.prenume} {buyer.nume}!
              </p>
            </div>
          </div>

          {isClosed && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-700 font-medium">
                {myOfferAccepted
                  ? '🎉 Oferta ta a fost acceptata! Agentul va lua legatura cu tine.'
                  : 'Proprietarul a acceptat o alta oferta. DealRoom-ul este inchis.'}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Users className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{buyerCount}</p>
            <p className="text-xs text-slate-500">cumparatori interesati</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Euro className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{oferte.length}</p>
            <p className="text-xs text-slate-500">oferte trimise</p>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Documente proprietate</h3>
          </div>

          {documente.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Niciun document disponibil momentan</p>
          ) : (
            <div className="space-y-2">
              {documente.map((doc) => (
                <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors group">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 flex-1 truncate">{doc.nume}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Other offers notification */}
        {otherOffersCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {otherOffersCount} {otherOffersCount === 1 ? 'alt cumparator a facut o oferta' : 'alti cumparatori au facut oferte'}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Cuantumul ofertelor celorlalti nu este vizibil</p>
            </div>
          </div>
        )}

        {/* My offer */}
        {myOffer ? (
          <div className={`bg-white rounded-2xl border p-5 ${myOfferAccepted ? 'border-green-300 bg-green-50' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-3">
              {myOfferAccepted ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Euro className="w-5 h-5 text-blue-600" />}
              <h3 className="text-sm font-semibold text-slate-900">
                {myOfferAccepted ? 'Oferta ta a fost ACCEPTATA!' : 'Oferta ta'}
              </h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(myOffer.suma)}</p>
            {myOffer.mesaj && <p className="text-sm text-slate-500 mt-1 italic">&quot;{myOffer.mesaj}&quot;</p>}
            <p className="text-xs text-slate-400 mt-2">{formatDate(myOffer.created_at)}</p>

            {myOfferAccepted && (
              <div className="mt-4 bg-green-100 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  Felicitari! Agentul va lua legatura cu tine in cel mai scurt timp pentru a finaliza tranzactia.
                </p>
              </div>
            )}
          </div>
        ) : !isClosed ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">Trimite oferta</h3>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div>
                <label className="label">Suma ofertata (EUR) *</label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={ofertaSum}
                    onChange={(e) => setOfertaSum(e.target.value)}
                    className="input-field pl-9"
                    placeholder="ex: 85000"
                    required
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="label">Mesaj (optional)</label>
                <textarea
                  value={ofertaMessage}
                  onChange={(e) => setOfertaMessage(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Orice conditii sau observatii despre oferta ta..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Trimite oferta
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  )
}
