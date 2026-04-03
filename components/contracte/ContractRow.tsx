'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, Send, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CONTRACT_TYPES, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, formatDate } from '@/lib/utils'
import { Contract } from '@/types'

export default function ContractRow({ contract }: { contract: Contract }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
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

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('contracts').delete().eq('id', contract.id)
    setDeleting(false)
    setConfirmDelete(false)
    router.refresh()
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex items-center gap-5 pr-2">
        <Link
          href={`/contracte/${contract.id}`}
          className="flex items-center gap-5 flex-1 min-w-0 p-5"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 truncate">
                {CONTRACT_TYPES[contract.tip_contract]}
              </h3>
              <span className={`badge ${CONTRACT_STATUS_COLORS[contract.status]}`}>
                {CONTRACT_STATUS_LABELS[contract.status]}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {contract.client_data?.nume} {contract.client_data?.prenume}
              {contract.property_data?.adresa && (
                <span className="text-slate-400"> • {contract.property_data.adresa}</span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(contract.created_at)}
            </p>
          </div>
          <div className="flex-shrink-0">
            {contract.status === 'semnat_ambele' || contract.status === 'finalizat' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : contract.status === 'trimis_client' || contract.status === 'semnat_client' ? (
              <Send className="w-5 h-5 text-blue-500" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            )}
          </div>
        </Link>

        {/* 3-dot menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setMenuOpen(o => !o) }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Acțiuni"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <Link
                href={`/contracte/${contract.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-4 h-4 text-slate-400" />
                Editează
              </Link>
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

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ștergi contractul?</h3>
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
    </>
  )
}
