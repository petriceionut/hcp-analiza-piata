'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DealRoom, DealRoomDocument, Buyer, Offer, OfferStatus } from '@/types'
import { formatCurrency, formatDateTime, PROPERTY_TYPES, PROPERTY_ICONS } from '@/lib/utils'
import {
  FileText,
  Download,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Send,
  Home,
  Users,
  AlertCircle,
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

const offerStatusConfig: Record<OfferStatus, { label: string; color: string; icon: React.ReactNode }> = {
  in_asteptare: {
    label: 'În așteptare',
    color: 'bg-amber-100 text-amber-700',
    icon: <Clock className="w-4 h-4" />,
  },
  acceptata: {
    label: 'Acceptată',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  respinsa: {
    label: 'Respinsă',
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="w-4 h-4" />,
  },
}

export default function BuyerDealRoomView({
  buyer,
  dealroom,
  documente,
  oferte,
  buyerCount,
  myOffer: initialMyOffer,
}: Props) {
  const [myOffer, setMyOffer] = useState<Offer | undefined>(initialMyOffer)
  const [suma, setSuma] = useState('')
  const [mesaj, setMesaj] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()
  const propertyIcon = PROPERTY_ICONS[dealroom.tip_proprietate]
  const propertyType = PROPERTY_TYPES[dealroom.tip_proprietate]

  const topOffer = oferte.reduce<number | null>((max, o) => {
    if (o.status === 'respinsa') return max
    return max === null ? o.suma : Math.max(max, o.suma)
  }, null)

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()

    const numericSuma = parseFloat(suma.replace(/[^\d.]/g, ''))
    if (!numericSuma || numericSuma <= 0) {
      toast.error('Introduceți o sumă validă.')
      return
    }

    setSubmitting(true)
    try {
      const { data: offer, error } = await supabase
        .from('offers')
        .insert({
          dealroom_id: dealroom.id,
          buyer_id: buyer.id,
          suma: numericSuma,
          mesaj: mesaj.trim() || null,
          status: 'in_asteptare',
        })
        .select()
        .single()

      if (error) throw error

      setMyOffer(offer as Offer)
      setSuma('')
      setMesaj('')
      toast.success('Oferta a fost trimisă cu succes!')
    } catch (err) {
      console.error(err)
      toast.error('Eroare la trimiterea ofertei. Încercați din nou.')
    } finally {
      setSubmitting(false)
    }
  }

  const isDealClosed = dealroom.status === 'inchis'
  const isOfferAccepted = dealroom.status === 'oferta_acceptata'

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 py-8 flex items-center gap-4">
            <span className="text-5xl">{propertyIcon}</span>
            <div className="text-white">
              <p className="text-emerald-100 text-sm font-medium">{propertyType}</p>
              <h1 className="text-xl font-bold mt-0.5">{dealroom.adresa_scurta}</h1>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{buyerCount} interes{buyerCount !== 1 ? 'e' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>
                {oferte.filter((o) => o.status !== 'respinsa').length} ofert
                {oferte.filter((o) => o.status !== 'respinsa').length !== 1 ? 'e' : 'ă'}
              </span>
            </div>
            {topOffer && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Ofertă maximă: {formatCurrency(topOffer)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Deal closed / offer accepted banners */}
        {isOfferAccepted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">O ofertă a fost acceptată</p>
              <p className="text-sm text-green-600 mt-0.5">
                Agentul a acceptat o ofertă. Tranzacția este în curs de finalizare.
              </p>
            </div>
          </div>
        )}

        {isDealClosed && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-700">DealRoom închis</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Acest DealRoom nu mai acceptă oferte noi.
              </p>
            </div>
          </div>
        )}

        {/* My Offer Status */}
        {myOffer && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Oferta mea
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(myOffer.suma)}
                </p>
                <p className="text-sm text-slate-400 mt-0.5">
                  Trimisă la {formatDateTime(myOffer.created_at)}
                </p>
                {myOffer.mesaj && (
                  <p className="text-sm text-slate-500 mt-2 italic">"{myOffer.mesaj}"</p>
                )}
              </div>
              <span
                className={`badge flex items-center gap-1.5 text-sm px-3 py-1.5 ${
                  offerStatusConfig[myOffer.status].color
                }`}
              >
                {offerStatusConfig[myOffer.status].icon}
                {offerStatusConfig[myOffer.status].label}
              </span>
            </div>

            {myOffer.status === 'acceptata' && (
              <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-700">
                <p className="font-semibold">Felicitări! Oferta dvs. a fost acceptată.</p>
                <p className="mt-0.5">Agentul vă va contacta în cel mai scurt timp pentru a continua tranzacția.</p>
              </div>
            )}

            {myOffer.status === 'respinsa' && !isDealClosed && !isOfferAccepted && (
              <div className="mt-4">
                <p className="text-sm text-red-600 mb-3">
                  Oferta dvs. a fost respinsă. Puteți trimite o nouă ofertă.
                </p>
                <OfferForm
                  suma={suma}
                  mesaj={mesaj}
                  submitting={submitting}
                  onSumaChange={setSuma}
                  onMesajChange={setMesaj}
                  onSubmit={handleSubmitOffer}
                />
              </div>
            )}
          </div>
        )}

        {/* Offer Form */}
        {!myOffer && !isDealClosed && !isOfferAccepted && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              Trimite ofertă
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Oferta dvs. va fi transmisă agentului imobiliar.
            </p>
            <OfferForm
              suma={suma}
              mesaj={mesaj}
              submitting={submitting}
              onSumaChange={setSuma}
              onMesajChange={setMesaj}
              onSubmit={handleSubmitOffer}
            />
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Documente proprietate
            <span className="text-xs text-slate-400 font-normal">({documente.length})</span>
          </h2>

          {documente.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Niciun document disponibil momentan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documente.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-transparent transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.nume}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(doc.uploaded_at)}</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2 transition-colors" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pb-4">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Home className="w-3.5 h-3.5" />
            <span>Bun venit, {buyer.prenume} {buyer.nume}</span>
          </div>
          <p>Toate ofertele sunt confidențiale și vizibile doar de agentul imobiliar.</p>
        </div>
      </div>
    </div>
  )
}

interface OfferFormProps {
  suma: string
  mesaj: string
  submitting: boolean
  onSumaChange: (v: string) => void
  onMesajChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

function OfferForm({ suma, mesaj, submitting, onSumaChange, onMesajChange, onSubmit }: OfferFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Suma ofertei (EUR) *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
            €
          </span>
          <input
            type="number"
            value={suma}
            onChange={(e) => onSumaChange(e.target.value)}
            className="input-field pl-8"
            placeholder="ex: 120000"
            min={1}
            required
          />
        </div>
      </div>
      <div>
        <label className="label">Mesaj (opțional)</label>
        <textarea
          value={mesaj}
          onChange={(e) => onMesajChange(e.target.value)}
          className="input-field resize-none"
          rows={3}
          placeholder="Adăugați un mesaj pentru agent..."
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !suma}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Se trimite...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Trimite oferta
          </>
        )}
      </button>
    </form>
  )
}
