'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'

interface BirthdayClient {
  id: string
  nume: string
  prenume: string
  data_nastere: string
}

interface Props {
  birthdays: BirthdayClient[]
}

export default function NotificationBell({ birthdays }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {birthdays.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {birthdays.length > 9 ? '9+' : birthdays.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">
              {birthdays.length > 0
                ? `${birthdays.length} aniversar${birthdays.length === 1 ? 'ă' : 'e'} azi`
                : 'Nicio aniversare azi'}
            </p>
          </div>
          {birthdays.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              Nu există zile de naștere astăzi.
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {birthdays.map(b => (
                <li key={b.id} className="px-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎂</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {b.prenume} {b.nume}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 border-t border-slate-100">
            <Link
              href="/calendar"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => setOpen(false)}
            >
              Vezi calendarul complet →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
