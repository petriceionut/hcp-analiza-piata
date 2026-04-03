import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Home, TrendingUp, ArrowRight, Plus } from 'lucide-react'
import { fetchNews } from '@/lib/news'
import NewsCarousel from '@/components/news/NewsCarousel'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch stats + news in parallel
  const [{ count: contracteCount }, { count: dealroomCount }, newsArticles] = await Promise.all([
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('agent_id', user?.id),
    supabase.from('dealrooms').select('*', { count: 'exact', head: true }).eq('agent_id', user?.id),
    fetchNews(15).catch(() => []),
  ])

  const modules = [
    {
      href: '/contracte',
      icon: FileText,
      title: 'Contracte',
      description: 'Creeaza, semneaza si gestioneaza contractele imobiliare cu semnatura digitala',
      color: 'from-blue-500 to-blue-700',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      count: contracteCount ?? 0,
      countLabel: 'contracte active',
      actions: [
        { label: 'Contract nou', href: '/contracte/nou', primary: true },
        { label: 'Vezi toate', href: '/contracte', primary: false },
      ],
    },
    {
      href: '/dealroom',
      icon: Home,
      title: 'DealRoom',
      description: 'Gestioneaza proprietatile, cumparatorii si ofertele intr-un spatiu securizat',
      color: 'from-emerald-500 to-emerald-700',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      count: dealroomCount ?? 0,
      countLabel: 'dealroom-uri active',
      actions: [
        { label: 'Vezi DealRoom-uri', href: '/dealroom', primary: true },
      ],
    },
    {
      href: '/acp',
      icon: TrendingUp,
      title: 'Analiza Comparativa de Piata',
      description: 'Analizeaza piata imobiliara cu AI si genereaza rapoarte comparative profesionale',
      color: 'from-purple-500 to-purple-700',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      count: null,
      countLabel: '',
      actions: [
        { label: 'Analiza noua', href: '/acp', primary: true },
      ],
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Buna ziua, {user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Selecteaza un modul pentru a incepe
        </p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon
          return (
            <div
              key={mod.href}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card header gradient */}
              <div className={`bg-gradient-to-r ${mod.color} p-6 pb-4`}>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {mod.count !== null && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">{mod.count}</div>
                      <div className="text-xs text-white/70">{mod.countLabel}</div>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mt-4">{mod.title}</h2>
              </div>

              {/* Card body */}
              <div className="p-6">
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  {mod.description}
                </p>

                <div className="flex flex-col gap-2">
                  {mod.actions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={
                        action.primary
                          ? `flex items-center justify-between px-4 py-2.5 bg-gradient-to-r ${mod.color} text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity`
                          : 'flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors'
                      }
                    >
                      {action.label}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* News carousel */}
      {newsArticles.length > 0 && (
        <div className="mt-8">
          <NewsCarousel articles={newsArticles} />
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Actiuni rapide</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/contracte/nou"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Contract nou
          </Link>
          <Link
            href="/acp"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Analiza piata
          </Link>
          <Link
            href="/dealroom"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            DealRoom-uri
          </Link>
        </div>
      </div>
    </div>
  )
}
