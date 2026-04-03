import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import AgentSigningView from './AgentSigningView'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function parseUserAgent(ua: string): string {
  let browser = 'Browser'
  if (ua.includes('Edg/'))       browser = `Edge ${ua.match(/Edg\/(\d+)/)?.[1] ?? ''}`
  else if (ua.includes('Chrome')) browser = `Chrome ${ua.match(/Chrome\/(\d+)/)?.[1] ?? ''}`
  else if (ua.includes('Firefox')) browser = `Firefox ${ua.match(/Firefox\/(\d+)/)?.[1] ?? ''}`
  else if (ua.includes('Safari'))  browser = `Safari ${ua.match(/Version\/(\d+)/)?.[1] ?? ''}`

  let os = 'OS'
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11'
  else if (ua.includes('Windows'))    os = 'Windows'
  else if (ua.includes('Mac OS X'))   os = 'macOS'
  else if (ua.includes('Android'))    os = `Android ${ua.match(/Android (\d+)/)?.[1] ?? ''}`
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux'))      os = 'Linux'

  return `${browser} / ${os}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Europe/Bucharest',
  })
}

export default async function SemneazaAgentPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = adminClient()

  const { data: sigReq, error } = await supabase
    .from('signature_requests')
    .select(`
      id, token, status,
      client_name, client_email, contract_text,
      signed_at, signer_ip,
      contracts ( client_data, status )
    `)
    .eq('token', params.token)
    .single()

  if (error || !sigReq) notFound()

  // Agent can only sign after client has signed
  if (sigReq.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">În așteptare</h1>
          <p className="text-slate-500">Contractul nu a fost semnat de client încă.</p>
        </div>
      </div>
    )
  }

  if (sigReq.status === 'semnat_complet') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Contract semnat complet</h1>
          <p className="text-slate-500">Ambele părți au semnat documentul.</p>
        </div>
      </div>
    )
  }

  const headersList = headers()
  const ip     = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? headersList.get('x-real-ip')
    ?? 'necunoscut'
  const ua     = headersList.get('user-agent') ?? ''
  const device = parseUserAgent(ua)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contract = sigReq.contracts as any

  // In v1 schema, status='signed' after both client and agent sign — use contracts.status
  if (contract?.status === 'semnat_ambele' || contract?.status === 'finalizat') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Contract semnat complet</h1>
          <p className="text-slate-500">Ambele părți au semnat documentul.</p>
        </div>
      </div>
    )
  }

  const clientSignedBlock = sigReq.signed_at
    ? {
        name:     sigReq.client_name,
        email:    sigReq.client_email,
        telefon:  contract?.client_data?.telefon ?? '',
        ip:       sigReq.signer_ip ?? '',
        device:   '',
        signedAt: formatDateTime(sigReq.signed_at),
      }
    : null

  return (
    <AgentSigningView
      token={sigReq.token}
      contractText={sigReq.contract_text}
      clientSignedBlock={clientSignedBlock}
      agentName="Petrice Ioan"
      agentEmail="ionutpetrice1224@gmail.com"
      agentIp={ip}
      agentDevice={device}
    />
  )
}
