import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SignatureRequestPage from '@/components/semnatura/SignatureRequestPage'

export default async function SemneazaPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('signature_requests')
    .select('token, client_name, contract_text, status')
    .eq('token', params.token)
    .single()

  if (error || !data) notFound()

  if (data.status === 'signed') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Document deja semnat</h1>
          <p className="text-slate-500">Ați semnat deja acest document. Mulțumim!</p>
        </div>
      </div>
    )
  }

  return (
    <SignatureRequestPage
      token={data.token}
      clientName={data.client_name}
      contractText={data.contract_text}
    />
  )
}
