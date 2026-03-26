'use client'

import { useState } from 'react'
import { WizardData } from '../ContractWizard'
import { ArrowRight, ArrowLeft, FileEdit } from 'lucide-react'

interface Props {
  data: WizardData
  onUpdate: (d: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

export default function StepDerogari({ data, onUpdate, onNext, onBack }: Props) {
  const [derogari, setDerogari] = useState(data.derogari ?? '')

  const handleNext = () => {
    onUpdate({ derogari })
    onNext()
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Derogari si observatii</h2>
      <p className="text-sm text-slate-500 mb-6">
        Adauga orice derogare de la clauzele contractuale standard sau observatii speciale.
        Acest camp este optional.
      </p>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileEdit className="w-4 h-4 text-slate-400" />
          <label className="label !mb-0">Derogari / Observatii / Clauze speciale</label>
        </div>
        <textarea
          value={derogari}
          onChange={(e) => setDerogari(e.target.value)}
          rows={10}
          className="input-field resize-none leading-relaxed"
          placeholder="Ex: Partile convin ca plata comisionului se va efectua in rate egale pe o perioada de 3 luni...&#10;&#10;Sau orice alta clauza speciala convenita intre parti..."
        />
        <p className="text-xs text-slate-400 mt-1">
          {derogari.length} caractere
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
        <p className="text-xs text-amber-700">
          <strong>Nota:</strong> Derogarile vor fi integrate in corpul contractului in sectiunea dedicata.
          Daca nu exista derogari, contractul se va semna conform clauzelor standard.
        </p>
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
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
        >
          Finalizeaza
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
