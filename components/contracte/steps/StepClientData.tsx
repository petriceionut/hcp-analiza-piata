'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { ClientData } from '@/types'
import { WizardData } from '../ContractWizard'
import { ArrowRight, ArrowLeft, Camera, Upload, Loader2, X, ScanLine, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  data: WizardData
  onUpdate: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

async function runOCR(
  file: File,
  setValue: (field: keyof ClientData, value: string) => void,
  setPreviewUrl: (u: string | null) => void,
  setLoading: (b: boolean) => void,
) {
  setLoading(true)
  setPreviewUrl(URL.createObjectURL(file))
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/ocr', { method: 'POST', body: formData })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.details ?? json?.error ?? 'OCR failed')

    const text: string = json.text ?? ''
    console.log('[OCR] Raw text from Google Vision:\n' + text)

    const cnpMatch = text.match(/\b([1256]\d{12})\b/)
    if (cnpMatch) setValue('cnp', cnpMatch[1])

    const serieMatch =
      text.match(/(?:Seria|S[eé]rie|Series)[^\n]*?\b([A-Z]{2})\b[^\n]*?\b(\d{6})\b/i) ||
      text.match(/\b([A-Z]{2})\s+(\d{6})\b/)
    if (serieMatch) {
      setValue('serie_buletin', serieMatch[1])
      setValue('nr_buletin', serieMatch[2])
    }

    const numeLabelIdx = text.search(/(?:Nume|Nom|Surname)[^\n]*/i)
    if (numeLabelIdx !== -1) {
      const afterNume = text.slice(numeLabelIdx).replace(/^[^\n]+\n/, '')
      const numeVal = afterNume.match(/^[ \t]*([A-ZĂÎȘȚÂ][A-ZĂÎȘȚÂ -]{1,29})[ \t]*$/m)
      if (numeVal) setValue('nume', numeVal[1].trim())
    }

    const prenumeLabelIdx = text.search(/(?:Prenume|Pr[eé]nom|Given\s+names?)[^\n]*/i)
    if (prenumeLabelIdx !== -1) {
      const afterPrenume = text.slice(prenumeLabelIdx).replace(/^[^\n]+\n/, '')
      const prenumeVal = afterPrenume.match(/^[ \t]*([A-ZĂÎȘȚÂ][A-ZĂÎȘȚÂ -]{1,39})[ \t]*$/m)
      if (prenumeVal) setValue('prenume', prenumeVal[1].trim())
    }

    const domLabelIdx = text.search(/Domiciliu/i)
    let adresaMatch: RegExpMatchArray | null = null
    if (domLabelIdx !== -1) {
      const fromDom = text.slice(domLabelIdx)
      adresaMatch =
        fromDom.match(/^Domiciliu[^\n]*?((?:Mun\.|Str\.|Cal\.|Calea|Sat |Com\.|Jud\.|Sector\s*\d)[^\n]{4,149})/i) ||
        fromDom.match(/^Domiciliu[^\n]*\n[ \t]*([^\n]{5,150})/i)
    }
    if (adresaMatch) setValue('adresa_domiciliu', adresaMatch[1].trim())

    const fieldsFound = [cnpMatch, serieMatch, numeLabelIdx !== -1, prenumeLabelIdx !== -1, adresaMatch].filter(Boolean).length
    if (fieldsFound > 0) {
      toast.success('Date extrase cu succes din buletin!')
    } else {
      toast.error('Nu s-au putut extrage datele. Completează manual.')
    }
  } catch {
    toast.error('Nu s-au putut extrage datele. Completează manual.')
  } finally {
    setLoading(false)
  }
}

function ClientOCRBox({
  loading,
  previewUrl,
  onFile,
  onClearPreview,
}: {
  loading: boolean
  previewUrl: string | null
  onFile: (f: File) => void
  onClearPreview: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLInputElement>(null)
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <ScanLine className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">Completare automată din buletin</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => camRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Camera className="w-4 h-4" />
          Fotografiază buletinul
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Încarcă fotografie
        </button>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Se extrag datele…
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      {previewUrl && (
        <div className="mt-3 relative inline-block">
          <img src={previewUrl} alt="Buletin" className="h-20 rounded-lg object-cover" />
          <button
            type="button"
            onClick={onClearPreview}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function StepClientData({ data, onUpdate, onNext, onBack }: Props) {
  const [hasCoproprietar, setHasCoproprietar] = useState(!!data.clientData2)

  // Client 1 OCR state
  const [ocr1Loading, setOcr1Loading] = useState(false)
  const [preview1, setPreview1] = useState<string | null>(null)

  // Client 2 OCR state
  const [ocr2Loading, setOcr2Loading] = useState(false)
  const [preview2, setPreview2] = useState<string | null>(null)

  const form1 = useForm<ClientData>({ defaultValues: data.clientData as ClientData })
  const form2 = useForm<ClientData>({ defaultValues: data.clientData2 as ClientData })

  const handleSubmit1 = form1.handleSubmit((values1) => {
    if (hasCoproprietar) {
      form2.handleSubmit((values2) => {
        onUpdate({ clientData: values1, clientData2: values2 })
        onNext()
      })()
    } else {
      onUpdate({ clientData: values1, clientData2: undefined })
      onNext()
    }
  })

  return (
    <form onSubmit={handleSubmit1} className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Date client</h2>
      <p className="text-sm text-slate-500 mb-6">Completează datele clientului sau fotografiază buletinul</p>

      {/* ── Client 1 ── */}
      <ClientOCRBox
        loading={ocr1Loading}
        previewUrl={preview1}
        onFile={(f) => runOCR(f, form1.setValue, setPreview1, setOcr1Loading)}
        onClearPreview={() => setPreview1(null)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Nume *</label>
          <input {...form1.register('nume', { required: 'Numele este obligatoriu' })}
            className="input-field" placeholder="ex: POPESCU" />
          {form1.formState.errors.nume && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.nume.message}</p>}
        </div>
        <div>
          <label className="label">Prenume *</label>
          <input {...form1.register('prenume', { required: 'Prenumele este obligatoriu' })}
            className="input-field" placeholder="ex: ION" />
          {form1.formState.errors.prenume && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.prenume.message}</p>}
        </div>
        <div>
          <label className="label">Serie buletin *</label>
          <input {...form1.register('serie_buletin', { required: 'Seria este obligatorie' })}
            className="input-field" placeholder="ex: IF" maxLength={2} />
          {form1.formState.errors.serie_buletin && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.serie_buletin.message}</p>}
        </div>
        <div>
          <label className="label">Nr. buletin *</label>
          <input {...form1.register('nr_buletin', { required: 'Numărul este obligatoriu' })}
            className="input-field" placeholder="ex: 123456" maxLength={6} />
          {form1.formState.errors.nr_buletin && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.nr_buletin.message}</p>}
        </div>
        <div>
          <label className="label">CNP *</label>
          <input {...form1.register('cnp', {
            required: 'CNP-ul este obligatoriu',
            pattern: { value: /^\d{13}$/, message: 'CNP invalid (13 cifre)' },
          })} className="input-field" placeholder="ex: 1900101123456" maxLength={13} />
          {form1.formState.errors.cnp && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.cnp.message}</p>}
        </div>
        <div>
          <label className="label">Nr. telefon *</label>
          <input {...form1.register('telefon', { required: 'Telefonul este obligatoriu' })}
            className="input-field" placeholder="ex: 0721234567" type="tel" />
          {form1.formState.errors.telefon && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.telefon.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Adresa de domiciliu *</label>
          <input {...form1.register('adresa_domiciliu', { required: 'Adresa este obligatorie' })}
            className="input-field" placeholder="ex: Str. Florilor nr. 5, ap. 2, sector 3, București" />
          {form1.formState.errors.adresa_domiciliu && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.adresa_domiciliu.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Adresa email *</label>
          <input {...form1.register('email', {
            required: 'Email-ul este obligatoriu',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalid' },
          })} className="input-field" placeholder="ex: client@email.com" type="email" />
          {form1.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.email.message}</p>}
        </div>
      </div>

      {/* ── Co-proprietar toggle ── */}
      <label className="flex items-center gap-3 cursor-pointer select-none mb-6 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
        <input
          type="checkbox"
          className="w-4 h-4 accent-blue-600"
          checked={hasCoproprietar}
          onChange={(e) => setHasCoproprietar(e.target.checked)}
        />
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Co-proprietar (semnează împreună)</span>
      </label>

      {/* ── Client 2 ── */}
      {hasCoproprietar && (
        <div className="border border-blue-200 rounded-xl p-4 mb-6 bg-blue-50/30">
          <p className="text-sm font-semibold text-blue-700 mb-4">Date co-proprietar</p>

          <ClientOCRBox
            loading={ocr2Loading}
            previewUrl={preview2}
            onFile={(f) => runOCR(f, form2.setValue, setPreview2, setOcr2Loading)}
            onClearPreview={() => setPreview2(null)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nume *</label>
              <input {...form2.register('nume', { required: hasCoproprietar ? 'Numele este obligatoriu' : false })}
                className="input-field" placeholder="ex: IONESCU" />
              {form2.formState.errors.nume && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.nume.message}</p>}
            </div>
            <div>
              <label className="label">Prenume *</label>
              <input {...form2.register('prenume', { required: hasCoproprietar ? 'Prenumele este obligatoriu' : false })}
                className="input-field" placeholder="ex: MARIA" />
              {form2.formState.errors.prenume && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.prenume.message}</p>}
            </div>
            <div>
              <label className="label">Serie buletin *</label>
              <input {...form2.register('serie_buletin', { required: hasCoproprietar ? 'Seria este obligatorie' : false })}
                className="input-field" placeholder="ex: IF" maxLength={2} />
              {form2.formState.errors.serie_buletin && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.serie_buletin.message}</p>}
            </div>
            <div>
              <label className="label">Nr. buletin *</label>
              <input {...form2.register('nr_buletin', { required: hasCoproprietar ? 'Numărul este obligatoriu' : false })}
                className="input-field" placeholder="ex: 654321" maxLength={6} />
              {form2.formState.errors.nr_buletin && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.nr_buletin.message}</p>}
            </div>
            <div>
              <label className="label">CNP *</label>
              <input {...form2.register('cnp', {
                required: hasCoproprietar ? 'CNP-ul este obligatoriu' : false,
                pattern: { value: /^\d{13}$/, message: 'CNP invalid (13 cifre)' },
              })} className="input-field" placeholder="ex: 2900101123456" maxLength={13} />
              {form2.formState.errors.cnp && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.cnp.message}</p>}
            </div>
            <div>
              <label className="label">Nr. telefon</label>
              <input {...form2.register('telefon')}
                className="input-field" placeholder="ex: 0721234567" type="tel" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Adresa de domiciliu *</label>
              <input {...form2.register('adresa_domiciliu', { required: hasCoproprietar ? 'Adresa este obligatorie' : false })}
                className="input-field" placeholder="ex: Str. Florilor nr. 5, ap. 2, sector 3, București" />
              {form2.formState.errors.adresa_domiciliu && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.adresa_domiciliu.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Adresa email</label>
              <input {...form2.register('email', {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalid' },
              })} className="input-field" placeholder="ex: client2@email.com" type="email" />
              {form2.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.email.message}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Înapoi
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
        >
          Mai departe
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}
