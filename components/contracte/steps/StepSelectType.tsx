'use client'

import { ContractType } from '@/types'
import { CONTRACT_TYPES } from '@/lib/utils'
import { WizardData } from '../ContractWizard'
import { ArrowRight, FileText, FileCheck, FileSignature, FileEdit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  data: WizardData
  onUpdate: (d: Partial<WizardData>) => void
  onNext: () => void
}

const CONTRACT_ICONS = {
  mandat_exclusivitate: FileEdit,
  mediere_vanzare: FileText,
  mediere_inchiriere: FileCheck,
  antecontract_vanzare: FileSignature,
}

const CONTRACT_DESCRIPTIONS: Record<ContractType, string> = {
  mandat_exclusivitate: 'Agent exclusiv pentru vanzarea/inchirierea proprietatii',
  mediere_vanzare: 'Intermediere intre vanzator si cumparator',
  mediere_inchiriere: 'Intermediere intre proprietar si chirias',
  antecontract_vanzare: 'Promisiune de vanzare-cumparare cu avans',
}

export default function StepSelectType({ data, onUpdate, onNext }: Props) {
  const selected = data.tipContract

  const handleSelect = (type: ContractType) => {
    onUpdate({ tipContract: type })
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Selecteaza tipul contractului</h2>
      <p className="text-sm text-slate-500 mb-6">Alege unul din cele 4 tipuri de contracte disponibile</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {(Object.keys(CONTRACT_TYPES) as ContractType[]).map((type) => {
          const Icon = CONTRACT_ICONS[type]
          const isSelected = selected === type
          return (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className={cn(
                'text-left p-5 rounded-xl border-2 transition-all duration-200',
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                isSelected ? 'bg-blue-600' : 'bg-gray-100'
              )}>
                <Icon className={cn('w-5 h-5', isSelected ? 'text-white' : 'text-gray-500')} />
              </div>
              <h3 className={cn(
                'font-semibold text-sm mb-1',
                isSelected ? 'text-blue-700' : 'text-slate-900'
              )}>
                {CONTRACT_TYPES[type]}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {CONTRACT_DESCRIPTIONS[type]}
              </p>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-sm font-semibold transition-all"
        >
          Mai departe
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
