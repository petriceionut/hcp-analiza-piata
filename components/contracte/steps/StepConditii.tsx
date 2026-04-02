'use client'

import { useForm } from 'react-hook-form'
import { WizardData } from '../ContractWizard'
import { ArrowRight, ArrowLeft } from 'lucide-react'

interface Props {
  data: WizardData
  onUpdate: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

interface ConditiiForm {
  durata: number
  dataIncepere: string
  comision: number
  viciiCunoscute?: string
  pretMinim?: number
  clarificari?: string
  cheltuieliLunare?: number
}

export default function StepConditii({ data, onUpdate, onNext, onBack }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ConditiiForm>({
    defaultValues: {
      durata: data.durata ?? 6,
      dataIncepere: data.dataIncepere ?? '',
      comision: data.comision,
      viciiCunoscute: data.viciiCunoscute ?? '',
      pretMinim: data.pretMinim,
      clarificari: data.clarificari ?? '',
      cheltuieliLunare: data.cheltuieliLunare,
    },
  })

  const onSubmit = (values: ConditiiForm) => {
    onUpdate({
      durata: values.durata,
      dataIncepere: values.dataIncepere,
      comision: values.comision,
      viciiCunoscute: values.viciiCunoscute,
      pretMinim: values.pretMinim,
      clarificari: values.clarificari,
      cheltuieliLunare: values.cheltuieliLunare,
    })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Condiții contract</h2>
      <p className="text-sm text-slate-500 mb-6">Stabilește durata, comisionul și condițiile specifice</p>

      {/* Duration / start date / commission */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="label">Durata contractului *</label>
          <select
            {...register('durata', { required: 'Durata este obligatorie', valueAsNumber: true })}
            className="input-field"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m} {m === 1 ? 'lună' : 'luni'}
              </option>
            ))}
          </select>
          {errors.durata && <p className="text-red-500 text-xs mt-1">{errors.durata.message}</p>}
        </div>

        <div>
          <label className="label">Data începere aplicare *</label>
          <input
            {...register('dataIncepere', { required: 'Data de începere este obligatorie' })}
            type="date"
            className="input-field"
          />
          {errors.dataIncepere && <p className="text-red-500 text-xs mt-1">{errors.dataIncepere.message}</p>}
        </div>

        <div>
          <label className="label">Comision agenție (%) *</label>
          <div className="relative">
            <input
              {...register('comision', {
                required: 'Comisionul este obligatoriu',
                valueAsNumber: true,
                min: { value: 0.1, message: 'Comisionul trebuie să fie pozitiv' },
                max: { value: 100, message: 'Nu poate depăși 100%' },
              })}
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              className="input-field pr-8"
              placeholder="ex: 3"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
          </div>
          {errors.comision && <p className="text-red-500 text-xs mt-1">{errors.comision.message}</p>}
        </div>
      </div>

      {/* Pret minim + cheltuieli */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Preț minim acceptat (EUR)</label>
          <input
            {...register('pretMinim', { valueAsNumber: true, min: { value: 0, message: 'Trebuie să fie pozitiv' } })}
            type="number"
            min="0"
            step="1000"
            className="input-field"
            placeholder="ex: 120000"
          />
          {errors.pretMinim && <p className="text-red-500 text-xs mt-1">{errors.pretMinim.message}</p>}
        </div>

        <div>
          <label className="label">Cheltuieli lunare (lei/lună)</label>
          <input
            {...register('cheltuieliLunare', { valueAsNumber: true, min: { value: 0, message: 'Trebuie să fie pozitiv' } })}
            type="number"
            min="0"
            step="100"
            className="input-field"
            placeholder="ex: 500"
          />
          {errors.cheltuieliLunare && <p className="text-red-500 text-xs mt-1">{errors.cheltuieliLunare.message}</p>}
        </div>
      </div>

      {/* Vicii cunoscute */}
      <div className="mb-4">
        <label className="label">Vicii cunoscute de Client</label>
        <textarea
          {...register('viciiCunoscute')}
          rows={3}
          className="input-field resize-none"
          placeholder="Descrieți orice vicii cunoscute ale imobilului…"
        />
      </div>

      {/* Clarificari */}
      <div className="mb-6">
        <label className="label">Clarificări</label>
        <textarea
          {...register('clarificari')}
          rows={3}
          className="input-field resize-none"
          placeholder="Chestiuni ce necesită clarificare privind imobilul…"
        />
      </div>

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
