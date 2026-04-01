'use client'

import { useState } from 'react'
import { ContractType, ClientData, PropertyData } from '@/types'
import StepSelectType from './steps/StepSelectType'
import StepClientData from './steps/StepClientData'
import StepPropertyData from './steps/StepPropertyData'
import StepConditii from './steps/StepConditii'
import StepDerogari from './steps/StepDerogari'
import StepPreview from './steps/StepPreview'
import { CheckCircle } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Tip contract' },
  { id: 2, label: 'Date client' },
  { id: 3, label: 'Date imobil' },
  { id: 4, label: 'Condiții contract' },
  { id: 5, label: 'Derogari' },
  { id: 6, label: 'Preview & Trimite' },
]

export interface WizardData {
  tipContract?: ContractType
  clientData?: Partial<ClientData>
  propertyData?: Partial<PropertyData>
  durata?: number
  comision?: number
  derogari?: string
}

export default function ContractWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<WizardData>({})

  const updateData = (update: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...update }))
  }

  const next = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length))
  const back = () => setCurrentStep((s) => Math.max(s - 1, 1))

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = step.id < currentStep
            const isActive = step.id === currentStep
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : step.id}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium hidden sm:block ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all ${
                      step.id < currentStep ? 'bg-green-400' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {currentStep === 1 && (
          <StepSelectType
            data={data}
            onUpdate={updateData}
            onNext={next}
          />
        )}
        {currentStep === 2 && (
          <StepClientData
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 3 && (
          <StepPropertyData
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 4 && (
          <StepConditii
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 5 && (
          <StepDerogari
            data={data}
            onUpdate={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 6 && (
          <StepPreview
            data={data}
            onBack={back}
          />
        )}
      </div>
    </div>
  )
}
