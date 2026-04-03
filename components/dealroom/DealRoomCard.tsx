'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEALROOM_STATUS_LABELS, formatDate } from '@/lib/utils'
import { DealRoom } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  activ:            'bg-green-100 text-green-700',
  oferta_acceptata: 'bg-amber-100 text-amber-700',
  inchis:           'bg-gray-100 text-gray-500',
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function DealRoomCard({ dr }: { dr: DealRoom }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(false), 2500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('dealrooms').delete().eq('id', dr.id)
    setDeleting(false)
    setConfirmDelete(false)
    router.refresh()
  }

  const title = [capitalize(dr.tip_proprietate ?? 'Proprietate'), dr.adresa_scurta]
    .filter(Boolean)
    .join(' - ')

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Card body — navigable */}
        <div className="flex items-start p-6 gap-2 flex-1">
          <Link href={`/dealroom/${dr.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <div className="flex items-start gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-900 leading-snug flex-1 min-w-0">
                {title}
              </h3>
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[dr.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {DEALROOM_STATUS_LABELS[dr.status] ?? dr.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">{formatDate(dr.created_at)}</p>
          </Link>

          {/* 3-dot menu */}
          <div className="relative flex-shrink-0 -mt-1" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setMenuOpen(o => !o) }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Acțiuni"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setToast(true) }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-slate-400" />
                  Editează
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Șterge
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Adaugă client
          </button>
        </div>
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ștergi DealRoom-ul?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Această acțiune este permanentă și nu poate fi anulată.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                {deleting ? 'Se șterge…' : 'Șterge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "În curând" toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50">
          În curând
        </div>
      )}
    </>
  )
}
