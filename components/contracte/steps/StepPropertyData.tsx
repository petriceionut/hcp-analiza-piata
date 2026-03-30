'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { PropertyData, PropertyType } from '@/types'
import { PROPERTY_TYPES } from '@/lib/utils'
import { WizardData } from '../ContractWizard'
import { ArrowRight, ArrowLeft, Upload, Loader2, ScanLine, Home, Building2, Trees, Store, Factory } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Props {
  data: WizardData
  onUpdate: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ElementType> = {
  apartament: Building2,
  casa: Home,
  teren: Trees,
  spatiu_comercial: Store,
  spatiu_industrial: Factory,
}

export default function StepPropertyData({ data, onUpdate, onNext, onBack }: Props) {
  const [ocrLoading, setOcrLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<PropertyType>(
    (data.propertyData?.tip_proprietate as PropertyType) || 'apartament'
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PropertyData>({
    defaultValues: {
      ...data.propertyData,
      tip_proprietate: selectedType,
    },
  })

  const processOCR = async (file: File) => {
    setOcrLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.details ?? data?.error ?? 'OCR failed')

      const text: string = data.text ?? ''

      // Parse raw OCR text for Romanian Extras Carte Funciara fields
      const cfMatch =
        text.match(/(?:Carte\s+Funciara|CF)\s+[Nn]r\.?\s*:?\s*(\d+)/i) ||
        text.match(/[Nn]r\.?\s*(?:carte\s+funciara|CF)\s*:?\s*(\d+)/i)
      if (cfMatch) setValue('nr_carte_funciara', cfMatch[1])

      const cadastralMatch =
        text.match(/[Nn]r\.?\s+[Cc]adastral\s*:?\s*(\d+)/i) ||
        text.match(/[Cc]adastral\s+[Nn]r\.?\s*:?\s*(\d+)/i)
      if (cadastralMatch) setValue('nr_cadastral', cadastralMatch[1])

      const adresaMatch =
        text.match(/(?:Adresa|Adresă|Situata|situată|Amplasament)\s*:?\s*([^\n]{10,100})/im) ||
        text.match(/((?:Str\.|Strada|Bulevardul|Calea|Intrarea)\s+[^\n]{5,80})/im)
      if (adresaMatch) setValue('adresa', adresaMatch[1].trim())

      // Surface areas: look for labeled values (mp / m²)
      const construitaMatch = text.match(/(?:construita|construită|desfasurata)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*m[p²2]/i)
      if (construitaMatch) setValue('suprafata_construita', parseFloat(construitaMatch[1].replace(',', '.')))

      const utilaMatch = text.match(/(?:utila|utilă)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*m[p²2]/i)
      if (utilaMatch) setValue('suprafata_utila', parseFloat(utilaMatch[1].replace(',', '.')))

      const terenMatch = text.match(/(?:teren|land)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*m[p²2]/i)
      if (terenMatch) setValue('suprafata_teren', parseFloat(terenMatch[1].replace(',', '.')))

      const fieldsFound = [cfMatch, cadastralMatch, adresaMatch, construitaMatch, utilaMatch, terenMatch].filter(Boolean).length
      if (fieldsFound > 0) {
        toast.success('Date extrase cu succes din extrasul CF!')
      } else {
        toast.error('Nu s-au putut extrage datele. Completeaza manual.')
      }
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

  const onSubmit = (values: PropertyData) => {
    onUpdate({ propertyData: { ...values, tip_proprietate: selectedType } })
    onNext()
  }

  const isHouseOrApartment = selectedType === 'casa' || selectedType === 'apartament'
  const hasTerrain = selectedType === 'teren' || selectedType === 'casa'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Date imobil</h2>
      <p className="text-sm text-slate-500 mb-6">Selecteaza tipul si completeaza datele proprietatii</p>

      {/* Property type selector */}
      <div className="mb-6">
        <label className="label">Tip proprietate *</label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(PROPERTY_TYPES) as PropertyType[]).map((type) => {
            const Icon = PROPERTY_TYPE_ICONS[type]
            const isSelected = selectedType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center',
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
                )}
              >
                <Icon className={cn('w-5 h-5', isSelected ? 'text-blue-600' : 'text-gray-400')} />
                <span className={cn('text-xs font-medium leading-tight', isSelected ? 'text-blue-700' : 'text-gray-600')}>
                  {PROPERTY_TYPES[type]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* OCR for CF extract */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ScanLine className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Completare automata din Extras CF</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={ocrLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Fotografiaza extrasul CF
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Incarca PDF / JPG
          </button>
          {ocrLoading && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Se extrag datele...
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="sm:col-span-2">
          <label className="label">Adresa proprietatii *</label>
          <input
            {...register('adresa', { required: 'Adresa este obligatorie' })}
            className="input-field"
            placeholder="ex: Str. Primaverii nr. 10, Domensti, jud. Ilfov"
          />
          {errors.adresa && <p className="text-red-500 text-xs mt-1">{errors.adresa.message}</p>}
        </div>

        {isHouseOrApartment && (
          <>
            <div>
              <label className="label">Suprafata construita (mp)</label>
              <input
                {...register('suprafata_construita', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="ex: 120"
                min={0}
              />
            </div>
            <div>
              <label className="label">Suprafata utila (mp)</label>
              <input
                {...register('suprafata_utila', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="ex: 95"
                min={0}
              />
            </div>
          </>
        )}

        {hasTerrain && (
          <div>
            <label className="label">Suprafata teren (mp)</label>
            <input
              {...register('suprafata_teren', { valueAsNumber: true })}
              type="number"
              className="input-field"
              placeholder="ex: 500"
              min={0}
            />
          </div>
        )}

        {selectedType === 'apartament' && (
          <>
            <div>
              <label className="label">Nr. camere</label>
              <input
                {...register('nr_camere', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="ex: 3"
                min={1}
                max={20}
              />
            </div>
            <div>
              <label className="label">Etaj</label>
              <input
                {...register('etaj')}
                className="input-field"
                placeholder="ex: 2 / parter / mansarda"
              />
            </div>
          </>
        )}

        <div>
          <label className="label">An constructie</label>
          <input
            {...register('an_constructie', { valueAsNumber: true })}
            type="number"
            className="input-field"
            placeholder="ex: 1995"
            min={1800}
            max={new Date().getFullYear()}
          />
        </div>

        <div>
          <label className="label">Nr. cadastral</label>
          <input
            {...register('nr_cadastral')}
            className="input-field"
            placeholder="ex: 12345"
          />
        </div>

        <div>
          <label className="label">Nr. carte funciara</label>
          <input
            {...register('nr_carte_funciara')}
            className="input-field"
            placeholder="ex: 67890"
          />
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
