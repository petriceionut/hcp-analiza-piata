'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
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

const EMPTY_FORM = { nume: '', prenume: '', telefon: '', email: '', data_vizionare: '', ora_vizionare: '' }

export default function DealRoomCard({ dr }: { dr: DealRoom }) {
  const router = useRouter()

  // 3-dot menu
  const [menuOpen, setMenuOpen]       = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Delete flow
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  // Add-client modal
  const [clientModal, setClientModal] = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)

  // Toasts
  const [toast, setToast]             = useState<string | null>(null)

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
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function openClientModal() {
    setForm(EMPTY_FORM)
    setClientModal(true)
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('dealroom_clients').insert({
      dealroom_id:    dr.id,
      nume:           form.nume,
      prenume:        form.prenume,
      telefon:        form.telefon,
      email:          form.email,
      data_vizionare: form.data_vizionare || null,
      ora_vizionare:  form.ora_vizionare  || null,
    })
    setSaving(false)
    if (error) {
      setToast('Eroare la salvare. Încearcă din nou.')
    } else {
      setClientModal(false)
      setToast('Client adăugat cu succes!')
      router.refresh()
    }
  }

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

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1'

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Card body */}
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
                  onClick={() => { setMenuOpen(false); setToast('În curând') }}
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
            onClick={openClientModal}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Adaugă client
          </button>
        </div>
      </div>

      {/* ── Add-client modal ───────────────────────────────────────────── */}
      {clientModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-slate-900">Adaugă client</h3>
              <button
                type="button"
                onClick={() => setClientModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveClient} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nume</label>
                  <input
                    type="text"
                    required
                    value={form.nume}
                    onChange={e => setForm(f => ({ ...f, nume: e.target.value }))}
                    className={inputCls}
                    placeholder="Popescu"
                  />
                </div>
                <div>
                  <label className={labelCls}>Prenume</label>
                  <input
                    type="text"
                    required
                    value={form.prenume}
                    onChange={e => setForm(f => ({ ...f, prenume: e.target.value }))}
                    className={inputCls}
                    placeholder="Ion"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Telefon</label>
                <input
                  type="tel"
                  required
                  value={form.telefon}
                  onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                  className={inputCls}
                  placeholder="07xx xxx xxx"
                />
              </div>

              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                  placeholder="client@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Data vizionării</label>
                  <input
                    type="date"
                    value={form.data_vizionare}
                    onChange={e => setForm(f => ({ ...f, data_vizionare: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Ora vizionării</label>
                  <input
                    type="time"
                    value={form.ora_vizionare}
                    onChange={e => setForm(f => ({ ...f, ora_vizionare: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClientModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {saving ? 'Se salvează…' : 'Salvează'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm delete dialog ──────────────────────────────────────── */}
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

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </>
  )
}
