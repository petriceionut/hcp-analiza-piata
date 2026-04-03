import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import NotificationBell from '@/components/layout/NotificationBell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch clients whose birthday is today (month + day match)
  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, client_data, data_nastere')
    .eq('agent_id', user.id)
    .not('data_nastere', 'is', null)

  const todayBirthdays = (contracts ?? [])
    .filter(c => {
      const dn = c.data_nastere as string | null
      if (!dn) return false
      // match MM-DD portion
      return dn.substring(5) === `${mm}-${dd}`
    })
    .map(c => ({
      id: c.id as string,
      nume: (c.client_data as { nume?: string })?.nume ?? '',
      prenume: (c.client_data as { prenume?: string })?.prenume ?? '',
      data_nastere: c.data_nastere as string,
    }))

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-end px-6 flex-shrink-0">
          <NotificationBell birthdays={todayBirthdays} />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
