import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
} from 'lucide-react'
import {
  CONTRACT_TYPES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  formatDateTime,
} from '@/lib/utils'
import { Contract } from '@/types'
import ContractDetailClient from '@/components/contracte/ContractDetailClient'

export default async function ContractDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.id)
    .eq('agent_id', user?.id)
    .single()

  if (!contract) notFound()

  const c = contract as Contract

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/contracte"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Inapoi la contracte
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {CONTRACT_TYPES[c.tip_contract]}
          </h1>
          <p className="text-slate-500 mt-1">
            {c.client_data?.prenume} {c.client_data?.nume} •{' '}
            {formatDateTime(c.created_at)}
          </p>
        </div>
        <span className={`badge text-sm px-3 py-1 ${CONTRACT_STATUS_COLORS[c.status]}`}>
          {CONTRACT_STATUS_LABELS[c.status]}
        </span>
      </div>

      {/* Timeline */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Starea semnarii</h3>
        <div className="flex items-center gap-0">
          {[
            { label: 'Creat', done: true, date: c.created_at },
            { label: 'Trimis client', done: c.status !== 'draft' },
            { label: 'Semnat client', done: c.client_semnat_la != null, date: c.client_semnat_la ?? undefined },
            { label: 'Semnat agent', done: c.agent_semnat_la != null, date: c.agent_semnat_la ?? undefined },
            { label: 'Finalizat', done: c.status === 'semnat_ambele' || c.status === 'finalizat' },
          ].map((step, idx, arr) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {step.done ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
                <span className={`text-xs mt-1 text-center leading-tight ${step.done ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </span>
                {step.date && (
                  <span className="text-xs text-gray-400">{formatDateTime(step.date)}</span>
                )}
              </div>
              {idx < arr.length - 1 && (
                <div className={`flex-1 h-0.5 mb-5 ${step.done && arr[idx + 1]?.done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <ContractDetailClient contract={c} />
    </div>
  )
}
