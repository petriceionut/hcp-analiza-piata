import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Contract } from '@/types'
import ContractRow from '@/components/contracte/ContractRow'

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
            <ContractRow key={contract.id} contract={contract} />
          ))}
        </div>
      )}
    </div>
  )
}
