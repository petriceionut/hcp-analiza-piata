'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { ClientData } from '@/types'
import { WizardData } from '../ContractWizard'
import { ArrowRight, ArrowLeft, Camera, Upload, Loader2, X, ScanLine } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  data: WizardData
  onUpdate: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

export default function StepClientData({ data, onUpdate, onNext, onBack }: Props) {
  const [ocrLoading, setOcrLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ClientData>({
    defaultValues: data.clientData as ClientData,
  })

  const processOCR = async (file: File) => {
    setOcrLoading(true)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/ocr/buletin', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('OCR failed')

      const extracted = await res.json()

      if (extracted.nume) setValue('nume', extracted.nume)
      if (extracted.prenume) setValue('prenume', extracted.prenume)
      if (extracted.serie_buletin) setValue('serie_buletin', extracted.serie_buletin)
      if (extracted.nr_buletin) setValue('nr_buletin', extracted.nr_buletin)
      if (extracted.cnp) setValue('cnp', extracted.cnp)
      if (extracted.adresa_domiciliu) setValue('adresa_domiciliu', extracted.adresa_domiciliu)

      toast.success('Date extrase cu succes din buletin!')
    } catch {
      toast.error('Nu s-au putut extrage datele. Completeaza manual.')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processOCR(file)
  }

  const onSubmit = (values: ClientData) => {
    onUpdate({ clientData: values })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Date client</h2>
      <p className="text-sm text-slate-500 mb-6">Completeaza datele clientului sau fotografiaza buletinul</p>

      {/* OCR options */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ScanLine className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">Completare automata din buletin</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Camera capture */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={ocrLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Camera className="w-4 h-4" />
            Fotografiaza buletinul
          </button>
          {/* File upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Incarca fotografie
          </button>
          {ocrLoading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Se extrag datele...
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {previewUrl && (
          <div className="mt-3 relative inline-block">
            <img src={previewUrl} alt="Buletin" className="h-20 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="label">Nume *</label>
          <input
            {...register('nume', { required: 'Numele este obligatoriu' })}
            className="input-field"
            placeholder="ex: POPESCU"
          />
          {errors.nume && <p className="text-red-500 text-xs mt-1">{errors.nume.message}</p>}
        </div>

        <div>
          <label className="label">Prenume *</label>
          <input
            {...register('prenume', { required: 'Prenumele este obligatoriu' })}
            className="input-field"
            placeholder="ex: ION"
          />
          {errors.prenume && <p className="text-red-500 text-xs mt-1">{errors.prenume.message}</p>}
        </div>

        <div>
          <label className="label">Serie buletin *</label>
          <input
            {...register('serie_buletin', { required: 'Seria este obligatorie' })}
            className="input-field"
            placeholder="ex: IF"
            maxLength={2}
          />
          {errors.serie_buletin && <p className="text-red-500 text-xs mt-1">{errors.serie_buletin.message}</p>}
        </div>

        <div>
          <label className="label">Nr. buletin *</label>
          <input
            {...register('nr_buletin', { required: 'Numarul este obligatoriu' })}
            className="input-field"
            placeholder="ex: 123456"
            maxLength={6}
          />
          {errors.nr_buletin && <p className="text-red-500 text-xs mt-1">{errors.nr_buletin.message}</p>}
        </div>

        <div>
          <label className="label">CNP *</label>
          <input
            {...register('cnp', {
              required: 'CNP-ul este obligatoriu',
              pattern: { value: /^\d{13}$/, message: 'CNP invalid (13 cifre)' },
            })}
            className="input-field"
            placeholder="ex: 1900101123456"
            maxLength={13}
          />
          {errors.cnp && <p className="text-red-500 text-xs mt-1">{errors.cnp.message}</p>}
        </div>

        <div>
          <label className="label">Nr. telefon *</label>
          <input
            {...register('telefon', { required: 'Telefonul este obligatoriu' })}
            className="input-field"
            placeholder="ex: 0721234567"
            type="tel"
          />
          {errors.telefon && <p className="text-red-500 text-xs mt-1">{errors.telefon.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="label">Adresa de domiciliu *</label>
          <input
            {...register('adresa_domiciliu', { required: 'Adresa este obligatorie' })}
            className="input-field"
            placeholder="ex: Str. Florilor nr. 5, ap. 2, sector 3, Bucuresti"
          />
          {errors.adresa_domiciliu && <p className="text-red-500 text-xs mt-1">{errors.adresa_domiciliu.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="label">Adresa email *</label>
          <input
            {...register('email', {
              required: 'Email-ul este obligatoriu',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalid' },
            })}
            className="input-field"
            placeholder="ex: client@email.com"
            type="email"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Inapoi
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
