import { createClient } from '@/lib/supabase/server'
import DocumentScanner from '@/components/scanner/DocumentScanner'

export default async function ScannerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select('id, adresa_scurta, tip_proprietate')
    .eq('agent_id', user!.id)
    .eq('status', 'activ')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Scanner Documente</h1>
        <p className="text-slate-500 text-sm mt-1">
          Fotografiază și convertește documente în PDF asociate unei proprietăți
        </p>
      </div>
      <DocumentScanner
        dealrooms={dealrooms ?? []}
        agentId={user!.id}
      />
    </div>
  )
}
