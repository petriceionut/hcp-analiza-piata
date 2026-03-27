import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText, Clock, CheckCircle, Send } from 'lucide-react'
import { CONTRACT_TYPES, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, formatDate } from '@/lib/utils'
import { Contract } from '@/types'

export default async function ContractePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('agent_id', user?.id)
    .order('created_at', { ascending: false })

  const contractList = (contracts ?? []) as Contract[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contracte</h1>
          <p className="text-slate-500 mt-1">
            {contractList.length} contract{contractList.length !== 1 ? 'e' : ''}
          </p>
        </div>
        <Link
          href="/contracte/nou"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Contract nou
        </Link>
      </div>

      {contractList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Niciun contract</h3>
          <p className="text-slate-500 mb-6">Creeaza primul tau contract digital</p>
          <Link
            href="/contracte/nou"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Contract nou
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {contractList.map((contract) => (
            <Link
              key={contract.id}
              href={`/contracte/${contract.id}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-100 transition-all flex items-center gap-5"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {CONTRACT_TYPES[contract.tip_contract]}
                  </h3>
                  <span className={`badge ${CONTRACT_STATUS_COLORS[contract.status]}`}>
                    {CONTRACT_STATUS_LABELS[contract.status]}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {contract.client_data?.nume} {contract.client_data?.prenume}
                  {contract.property_data?.adresa && (
                    <span className="text-slate-400"> • {contract.property_data.adresa}</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(contract.created_at)}
                </p>
              </div>

              {/* Status indicator */}
              <div className="flex-shrink-0">
                {contract.status === 'semnat_ambele' || contract.status === 'finalizat' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : contract.status === 'trimis_client' || contract.status === 'semnat_client' ? (
                  <Send className="w-5 h-5 text-blue-500" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
