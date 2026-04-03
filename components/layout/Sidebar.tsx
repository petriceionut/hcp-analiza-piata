'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  Building2,
  CalendarDays,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: { email?: string; id: string }
}

const navItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    exact: true,
  },
  {
    href: '/contracte',
    icon: FileText,
    label: 'Contracte',
  },
  {
    href: '/dealroom',
    icon: Home,
    label: 'DealRoom',
  },
  {
    href: '/calendar',
    icon: CalendarDays,
    label: 'Calendar',
  },
  {
    href: '/acp',
    icon: TrendingUp,
    label: 'Analiza Piata',
  },
]

export default function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Deconectat cu succes')
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-slate-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-bold text-lg">HCP</span>
            <p className="text-xs text-slate-400 truncate">Platforma Imobiliara</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {collapsed && (
                <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-700 p-3 space-y-1">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-200" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-900/30 hover:text-red-400 transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Deconectare</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-slate-300" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-slate-300" />
        )}
      </button>
    </aside>
  )
}
