'use client'

import { useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { createClient } from '@/lib/supabase/client'
import { ScanLine, Plus, Trash2, FileDown, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Dealroom {
  id: string
  adresa_scurta: string
  tip_proprietate: string
}

interface Props {
  dealrooms: Dealroom[]
  agentId: string
}

export default function DocumentScanner({ dealrooms, agentId }: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pages, setPages] = useState<{ file: File; preview: string }[]>([])
  const [dealroomId, setDealroomId] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAddPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const newPages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPages(prev => [...prev, ...newPages])
    e.target.value = ''
  }

  const removePage = (index: number) => {
    setPages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSave = async () => {
    if (pages.length === 0) { toast.error('Adaugă cel puțin o pagină'); return }
    if (!dealroomId) { toast.error('Selectează proprietatea'); return }
    if (!documentName.trim()) { toast.error('Introdu un nume pentru document'); return }

    setSaving(true)
    try {
      // Build PDF
      const pdfDoc = await PDFDocument.create()

      for (const { file } of pages) {
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)

        let image
        if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(bytes)
        } else {
          // jpeg / webp → embed as jpeg (webp falls back gracefully)
          image = await pdfDoc.embedJpg(bytes)
        }

        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
      }

      const pdfBytes = await pdfDoc.save()
      const pdfBlob = new Blob([pdfBytes as Uint8Array], { type: 'application/pdf' })

      // Upload to Supabase Storage
      const fileName = `${dealroomId}/${Date.now()}-${documentName.trim().replace(/\s+/g, '_')}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('documente-proprietati')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage
        .from('documente-proprietati')
        .getPublicUrl(fileName)

      // Save record
      const { error: dbError } = await supabase
        .from('documente_scanate')
        .insert({
          dealroom_id: dealroomId,
          agent_id: agentId,
          file_url: urlData.publicUrl,
          file_name: documentName.trim(),
          nr_pagini: pages.length,
        })

      if (dbError) throw new Error(dbError.message)

      toast.success('Document salvat cu succes!')

      // Reset
      pages.forEach(p => URL.revokeObjectURL(p.preview))
      setPages([])
      setDocumentName('')
      setDealroomId('')
    } catch (err) {
      console.error(err)
      toast.error('Eroare la salvarea documentului')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page previews */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">
            Pagini scanate
            {pages.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-400">({pages.length} {pages.length === 1 ? 'pagină' : 'pagini'})</span>
            )}
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adaugă pagină
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleAddPage}
          />
        </div>

        {pages.length === 0 ? (
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ScanLine className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Apasă pentru a scana prima pagină</p>
            <p className="text-xs text-slate-400 mt-1">Se va deschide camera dispozitivului</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {pages.map((page, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-[3/4] bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.preview}
                  alt={`Pagina ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => removePage(i)}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                  {i + 1}
                </div>
              </div>
            ))}
            {/* Add more button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-xs">Adaugă</span>
            </button>
          </div>
        )}
      </div>

      {/* Document details */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Detalii document</h2>

        <div>
          <label className="label">Selectează proprietatea *</label>
          <select
            value={dealroomId}
            onChange={e => setDealroomId(e.target.value)}
            className="input-field"
          >
            <option value="">— Alege proprietatea —</option>
            {dealrooms.map(dr => (
              <option key={dr.id} value={dr.id}>
                {dr.adresa_scurta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Numele documentului *</label>
          <input
            type="text"
            value={documentName}
            onChange={e => setDocumentName(e.target.value)}
            className="input-field"
            placeholder="ex: Extras CF, Schița apartament..."
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || pages.length === 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium rounded-xl transition-colors"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Se generează PDF...
          </>
        ) : (
          <>
            <FileDown className="w-5 h-5" />
            Generează și Salvează PDF
          </>
        )}
      </button>
    </div>
  )
}
