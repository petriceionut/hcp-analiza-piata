import { createClient } from '@/lib/supabase/server'
import BirthdayCalendar from '@/components/calendar/BirthdayCalendar'

export default async function CalendarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, client_data, data_nastere')
    .eq('agent_id', user!.id)
    .not('data_nastere', 'is', null)

  const entries = (contracts ?? []).map(c => ({
    id: c.id as string,
    nume: (c.client_data as { nume?: string })?.nume ?? '',
    prenume: (c.client_data as { prenume?: string })?.prenume ?? '',
    data_nastere: c.data_nastere as string,
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Calendar Zile de Naștere</h1>
        <p className="text-slate-500 text-sm mt-1">
          Ziua de naștere a clienților, extrasă din CNP
        </p>
      </div>
      <BirthdayCalendar entries={entries} />
    </div>
  )
}
