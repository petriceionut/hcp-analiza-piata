'use client'

import { useRef, useState } from 'react'
import { Camera, Upload, Loader2, X, ScanLine, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExtractedIDData {
  nume?: string
  prenume?: string
  serie_buletin?: string
  nr_buletin?: string
  cnp?: string
  adresa_domiciliu?: string
}

interface ExtractedCFData {
  nr_carte_funciara?: string
  nr_cadastral?: string
  adresa_proprietate?: string
  suprafata?: string
}

function parseIDText(text: string): ExtractedIDData {
  const result: ExtractedIDData = {}

  // CNP: 13-digit number starting with 1, 2, 5 or 6
  const cnpMatch = text.match(/\b([1256]\d{12})\b/)
  if (cnpMatch) result.cnp = cnpMatch[1]

  // Series: "Seria/Série/Series IF Nr./No. 123456" — all on one line
  const serieMatch =
    text.match(/(?:Seria|S[eé]rie|Series)[^\n]*?\b([A-Z]{2})\b[^\n]*?\b(\d{6})\b/i) ||
    text.match(/\b([A-Z]{2})\s+(\d{6})\b/)
  if (serieMatch) {
    result.serie_buletin = serieMatch[1]
    result.nr_buletin = serieMatch[2]
  }

  // Surname: [ \t] instead of \s — stops capture at newline, not next label line
  const numeMatch = text.match(/(?:Nume|Nom|Surname)[^\n]*\n[ \t]*([A-ZĂÎȘȚÂ][A-ZĂÎȘȚÂ \t-]{0,29})/im)
  if (numeMatch) result.nume = numeMatch[1].trim()

  // Given name: same — [ \t] prevents bleeding into Cetățenie or next label
  const prenumeMatch = text.match(/(?:Prenume|Pr[eé]nom|Given\s+names?)[^\n]*\n[ \t]*([A-ZĂÎȘȚÂ][A-ZĂÎȘȚÂ \t-]{0,39})/im)
  if (prenumeMatch) result.prenume = prenumeMatch[1].trim()

  // Address: anchor only to "Domiciliu" — not "Adresa/Address" which appears on
  // other label lines (e.g. birthplace) before the actual domiciliu on the card
  const adresaMatch = text.match(/Domiciliu[^\n]*\n[ \t]*([^\n]{5,150})/im)
  if (adresaMatch) result.adresa_domiciliu = adresaMatch[1].trim()

  return result
}

function parseCFText(text: string): ExtractedCFData {
  const result: ExtractedCFData = {}

  // Nr. Carte Funciara
  const cfMatch =
    text.match(/(?:Carte\s+Funciara|CF)\s+[Nn]r\.?\s*:?\s*(\d+)/i) ||
    text.match(/[Nn]r\.?\s*(?:carte\s+funciara|CF)\s*:?\s*(\d+)/i)
  if (cfMatch) result.nr_carte_funciara = cfMatch[1]

  // Nr. Cadastral
  const cadastralMatch =
    text.match(/[Nn]r\.?\s+[Cc]adastral\s*:?\s*(\d+)/i) ||
    text.match(/[Cc]adastral\s+[Nn]r\.?\s*:?\s*(\d+)/i)
  if (cadastralMatch) result.nr_cadastral = cadastralMatch[1]

  // Address/location
  const adresaMatch =
    text.match(/(?:Adresa|Adresă|Situata|situată|Amplasament)\s*:?\s*([^\n]{10,100})/im) ||
    text.match(/(?:Str\.|Strada|Bulevardul|Calea|Intrarea)\s+[^\n]{5,80}/im)
  if (adresaMatch) result.adresa_proprietate = adresaMatch[0].trim()

  // Surface area (mp / m²)
  const suprafataMatch =
    text.match(/(\d+(?:[.,]\d+)?)\s*(?:mp|m²|m2|metri\s+patrati)/i)
  if (suprafataMatch) result.suprafata = suprafataMatch[1].replace(',', '.')

  return result
}

interface UploadCardProps {
  title: string
  description: string
  previewUrl: string | null
  loading: boolean
  onFile: (file: File) => void
  onClearPreview: () => void
  children?: React.ReactNode
}

function UploadCard({
  title,
  description,
  previewUrl,
  loading,
  onFile,
  onClearPreview,
  children,
}: UploadCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ScanLine className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">{title}</span>
      </div>
      <p className="text-xs text-blue-600">{description}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Camera className="w-4 h-4" />
          Fotografiază
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Încarcă fișier
        </button>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Se extrag datele...
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />

      {previewUrl && (
        <div className="relative inline-block">
          <img src={previewUrl} alt="Document" className="h-20 rounded-lg object-cover border border-blue-200" />
          <button
            type="button"
            onClick={onClearPreview}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {children}
    </div>
  )
}

interface FieldRowProps {
  label: string
  value?: string
  onChange: (v: string) => void
}

function FieldRow({ label, value, onChange }: FieldRowProps) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        placeholder="—"
      />
    </div>
  )
}

export default function ACPClient() {
  // Buletin identitate state
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [idLoading, setIdLoading] = useState(false)
  const [idDone, setIdDone] = useState(false)
  const [idData, setIdData] = useState<ExtractedIDData>({})

  // Extras carte funciara state
  const [cfPreview, setCfPreview] = useState<string | null>(null)
  const [cfLoading, setCfLoading] = useState(false)
  const [cfDone, setCfDone] = useState(false)
  const [cfData, setCfData] = useState<ExtractedCFData>({})

  const runOCR = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/ocr', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      const detail = data?.details ?? data?.error ?? 'OCR failed'
      throw new Error(detail)
    }

    return data.text ?? ''
  }

  const handleIDFile = async (file: File) => {
    const url = URL.createObjectURL(file)
    setIdPreview(url)
    setIdLoading(true)
    setIdDone(false)

    try {
      const text = await runOCR(file)
      const extracted = parseIDText(text)
      setIdData(extracted)
      setIdDone(true)

      const foundCount = Object.values(extracted).filter(Boolean).length
      if (foundCount > 0) {
        toast.success(`${foundCount} câmpuri extrase din buletin!`)
      } else {
        toast.error('Nu s-au putut extrage date. Verificați imaginea.')
      }
    } catch {
      toast.error('Eroare la procesare OCR. Încercați din nou.')
    } finally {
      setIdLoading(false)
    }
  }

  const handleCFFile = async (file: File) => {
    const url = URL.createObjectURL(file)
    setCfPreview(url)
    setCfLoading(true)
    setCfDone(false)

    try {
      const text = await runOCR(file)
      const extracted = parseCFText(text)
      setCfData(extracted)
      setCfDone(true)

      const foundCount = Object.values(extracted).filter(Boolean).length
      if (foundCount > 0) {
        toast.success(`${foundCount} câmpuri extrase din extras CF!`)
      } else {
        toast.error('Nu s-au putut extrage date. Verificați documentul.')
      }
    } catch {
      toast.error('Eroare la procesare OCR. Încercați din nou.')
    } finally {
      setCfLoading(false)
    }
  }

  const updateIdData = (field: keyof ExtractedIDData) => (value: string) => {
    setIdData((prev) => ({ ...prev, [field]: value }))
  }

  const updateCfData = (field: keyof ExtractedCFData) => (value: string) => {
    setCfData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Buletin Identitate Section */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Buletin de Identitate</h2>
            <p className="text-sm text-slate-500">
              Fotografiați sau încărcați buletinul pentru extragere automată date
            </p>
          </div>
          {idDone && (
            <div className="ml-auto flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Date extrase
            </div>
          )}
        </div>

        <UploadCard
          title="Scanare buletin identitate"
          description="Fotografiați sau încărcați o imagine clară a buletinului de identitate"
          previewUrl={idPreview}
          loading={idLoading}
          onFile={handleIDFile}
          onClearPreview={() => {
            setIdPreview(null)
            setIdDone(false)
            setIdData({})
          }}
        />

        {(idDone || Object.keys(idData).length > 0) && (
          <div className="space-y-1">
            {!idDone && Object.keys(idData).length === 0 && (
              <div className="flex items-center gap-2 text-amber-600 text-sm mb-2">
                <AlertCircle className="w-4 h-4" />
                Completați manual câmpurile de mai jos
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRow label="Nume" value={idData.nume} onChange={updateIdData('nume')} />
              <FieldRow label="Prenume" value={idData.prenume} onChange={updateIdData('prenume')} />
              <FieldRow label="Serie buletin" value={idData.serie_buletin} onChange={updateIdData('serie_buletin')} />
              <FieldRow label="Nr. buletin" value={idData.nr_buletin} onChange={updateIdData('nr_buletin')} />
              <FieldRow label="CNP" value={idData.cnp} onChange={updateIdData('cnp')} />
              <div className="sm:col-span-2">
                <FieldRow
                  label="Adresă domiciliu"
                  value={idData.adresa_domiciliu}
                  onChange={updateIdData('adresa_domiciliu')}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extras Carte Funciara Section */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Extras Carte Funciară</h2>
            <p className="text-sm text-slate-500">
              Fotografiați sau încărcați extrasul de carte funciară al proprietății
            </p>
          </div>
          {cfDone && (
            <div className="ml-auto flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Date extrase
            </div>
          )}
        </div>

        <UploadCard
          title="Scanare extras carte funciară"
          description="Fotografiați sau încărcați extrasul CF pentru extragere automată a datelor cadastrale"
          previewUrl={cfPreview}
          loading={cfLoading}
          onFile={handleCFFile}
          onClearPreview={() => {
            setCfPreview(null)
            setCfDone(false)
            setCfData({})
          }}
        />

        {(cfDone || Object.keys(cfData).length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow
              label="Nr. Carte Funciară"
              value={cfData.nr_carte_funciara}
              onChange={updateCfData('nr_carte_funciara')}
            />
            <FieldRow
              label="Nr. Cadastral"
              value={cfData.nr_cadastral}
              onChange={updateCfData('nr_cadastral')}
            />
            <FieldRow
              label="Suprafață (mp)"
              value={cfData.suprafata}
              onChange={updateCfData('suprafata')}
            />
            <div className="sm:col-span-2">
              <FieldRow
                label="Adresă proprietate"
                value={cfData.adresa_proprietate}
                onChange={updateCfData('adresa_proprietate')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
