'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BirthdayEntry {
  id: string
  nume: string
  prenume: string
  data_nastere: string // ISO YYYY-MM-DD
}

interface Props {
  entries: BirthdayEntry[]
}

const MONTH_NAMES = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du']

export default function BirthdayCalendar({ entries }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Build a map: day-of-month -> entries for that day (month/day match)
  const birthdaysByDay: Record<number, BirthdayEntry[]> = {}
  for (const e of entries) {
    const d = new Date(e.data_nastere + 'T00:00:00')
    if (d.getMonth() === month) {
      const day = d.getDate()
      if (!birthdaysByDay[day]) birthdaysByDay[day] = []
      birthdaysByDay[day].push(e)
    }
  }

  // Days in month, first weekday (Mon=0)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Mon-based

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const isToday = day !== null &&
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
          const hasBirthdays = day !== null && !!birthdaysByDay[day]

          return (
            <div
              key={i}
              className={`min-h-[64px] rounded-lg p-1.5 ${
                day === null ? '' :
                isToday ? 'bg-blue-50 border border-blue-200' :
                hasBirthdays ? 'bg-amber-50 border border-amber-200' :
                'border border-transparent hover:bg-slate-50'
              }`}
            >
              {day !== null && (
                <>
                  <span className={`text-xs font-medium block text-right ${
                    isToday ? 'text-blue-600' : 'text-slate-500'
                  }`}>
                    {day}
                  </span>
                  {hasBirthdays && (
                    <div className="mt-0.5 space-y-0.5">
                      {birthdaysByDay[day].map(e => (
                        <div
                          key={e.id}
                          className="text-[10px] leading-tight bg-amber-100 text-amber-800 rounded px-1 py-0.5 truncate"
                          title={`${e.prenume} ${e.nume}`}
                        >
                          🎂 {e.prenume} {e.nume}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
