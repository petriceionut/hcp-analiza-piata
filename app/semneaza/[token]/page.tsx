import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SigningPage from '@/components/semnatura/SigningPage'
import { Contract } from '@/types'

export default async function SemneazaPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createAdminClient()

  // Find contract by client token
  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .or(`client_token.eq.${params.token},agent_token.eq.${params.token}`)
    .single()

  if (!contract) notFound()

  const c = contract as Contract
  const isClientToken = c.client_token === params.token
  const isAgentToken = c.agent_token === params.token

  // Check if already signed
  if (isClientToken && c.client_semnat_la) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Contract deja semnat</h1>
          <p className="text-slate-500">Ati semnat deja acest contract. Multumim!</p>
        </div>
      </div>
    )
  }

  if (isAgentToken && c.agent_semnat_la) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Contract deja semnat</h1>
          <p className="text-slate-500">Ati semnat deja acest contract.</p>
        </div>
      </div>
    )
  }

  // Agent must wait for client to sign first
  if (isAgentToken && !c.client_semnat_la) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">In asteptare</h1>
          <p className="text-slate-500">
            Contractul va fi disponibil pentru semnare dupa ce clientul{' '}
            <strong>{c.client_data?.prenume} {c.client_data?.nume}</strong> il semneaza.
          </p>
        </div>
      </div>
    )
  }

  return (
    <SigningPage
      contract={c}
      token={params.token}
      signerType={isClientToken ? 'client' : 'agent'}
    />
  )
}
