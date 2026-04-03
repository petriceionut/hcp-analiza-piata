import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import ClientSigningView from './ClientSigningView'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function SemneazaPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = adminClient()

  const { data: sigReq, error } = await supabase
    .from('signature_requests')
    .select(`
      token, status, client_name, client_email, contract_text,
      contracts ( client_data )
    `)
    .eq('token', params.token)
    .single()

  if (error || !sigReq) notFound()

  if (sigReq.status === 'semnat_client' || sigReq.status === 'semnat_complet') {
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

  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? headersList.get('x-real-ip')
    ?? 'necunoscut'
  const ua = headersList.get('user-agent') ?? ''
  const device = parseUserAgent(ua)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contractData = sigReq.contracts as any
  const telefon: string = contractData?.client_data?.telefon ?? ''

  return (
    <ClientSigningView
      token={sigReq.token}
      contractText={sigReq.contract_text}
      clientName={sigReq.client_name}
      clientEmail={sigReq.client_email}
      telefon={telefon}
      ip={ip}
      device={device}
    />
  )
}

function parseUserAgent(ua: string): string {
  let browser = 'Browser'
  if (ua.includes('Edg/'))      browser = `Edge ${ua.match(/Edg\/(\d+)/)?.[1] ?? ''}`
  else if (ua.includes('Chrome')) browser = `Chrome ${ua.match(/Chrome\/(\d+)/)?.[1] ?? ''}`
  else if (ua.includes('Firefox')) browser = `Firefox ${ua.match(/Firefox\/(\d+)/)?.[1] ?? ''}`
  else if (ua.includes('Safari'))  browser = `Safari ${ua.match(/Version\/(\d+)/)?.[1] ?? ''}`

  let os = 'OS'
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11'
  else if (ua.includes('Windows'))     os = 'Windows'
  else if (ua.includes('Mac OS X'))    os = 'macOS'
  else if (ua.includes('Android'))     os = `Android ${ua.match(/Android (\d+)/)?.[1] ?? ''}`
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux'))       os = 'Linux'

  return `${browser} / ${os}`
}
