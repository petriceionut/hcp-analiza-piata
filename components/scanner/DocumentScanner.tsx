'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { createClient } from '@/lib/supabase/client'
import {
  Camera, Check, ChevronLeft, FileDown, Loader2, RotateCcw, ScanLine, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Dealroom { id: string; adresa_scurta: string; tip_proprietate: string }
interface Props { dealrooms: Dealroom[]; agentId: string }
interface CropBox { x: number; y: number; w: number; h: number }
interface DragState { handle: string; mx: number; my: number; box: CropBox }

const EMOJI: Record<string, string> = {
  apartament: '🏢', casa: '🏠', teren: '🌿', spatiu_comercial: '🏪', spatiu_industrial: '🏭',
}

export default function DocumentScanner({ dealrooms, agentId }: Props) {
  const supabase = createClient()

  // Pages (data URLs of cropped/enhanced images)
  const [pages, setPages] = useState<string[]>([])

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null) // data URL after capture
  const [naturalW, setNaturalW] = useState(1)
  const [naturalH, setNaturalH] = useState(1)
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 })
  const [drag, setDrag] = useState<DragState | null>(null)

  // Property overlay
  const [showProps, setShowProps] = useState(false)
  const [docName, setDocName] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cropRef = useRef<HTMLDivElement>(null)

  // ── Camera helpers ──────────────────────────────────────────────────────────

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
    } catch {
      toast.error('Cameră indisponibilă')
      setCameraOpen(false)
    }
  }, [])

  // Attach stream when video element mounts (cameraOpen=true, no captured image)
  useEffect(() => {
    if (cameraOpen && !captured && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraOpen, captured])

  // Cleanup on unmount
  useEffect(() => () => stopStream(), [stopStream])

  const openCamera = useCallback(() => {
    setCameraOpen(true)
    startStream()
  }, [startStream])

  const closeCamera = useCallback(() => {
    stopStream()
    setCaptured(null)
    setCameraOpen(false)
  }, [stopStream])

  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const w = video.videoWidth || 1280
    const h = video.videoHeight || 720
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    // Auto-enhance: bump contrast + brightness
    ctx.filter = 'contrast(1.15) brightness(1.06)'
    ctx.drawImage(video, 0, 0)
    ctx.filter = 'none'
    stopStream()
    setNaturalW(w); setNaturalH(h)
    // Initialize crop box to image bounds within the container
    setCropBox({ x: 0.04, y: 0.04, w: 0.92, h: 0.92 })
    setCaptured(canvas.toDataURL('image/jpeg', 0.93))
  }, [stopStream])

  const retake = useCallback(() => {
    setCaptured(null)
    startStream()
  }, [startStream])

  const usePhoto = useCallback(() => {
    if (!captured) return
    const img = new Image()
    img.onload = () => {
      const sx = Math.round(cropBox.x * naturalW)
      const sy = Math.round(cropBox.y * naturalH)
      const sw = Math.max(1, Math.round(cropBox.w * naturalW))
      const sh = Math.max(1, Math.round(cropBox.h * naturalH))
      const canvas = document.createElement('canvas')
      canvas.width = sw; canvas.height = sh
      canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      setPages(prev => [...prev, canvas.toDataURL('image/jpeg', 0.93)])
      setCaptured(null)
      setCameraOpen(false)
    }
    img.src = captured
  }, [captured, cropBox, naturalW, naturalH])

  // ── Crop drag (Pointer Events) ──────────────────────────────────────────────

  const getRelPos = (e: React.PointerEvent) => {
    const el = cropRef.current!
    const r = el.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    }
  }

  const onPointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const p = getRelPos(e)
    setDrag({ handle, mx: p.x, my: p.y, box: { ...cropBox } })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    const p = getRelPos(e)
    const dx = p.x - drag.mx
    const dy = p.y - drag.my
    const b = drag.box
    const MIN = 0.08
    let { x, y, w, h } = b

    switch (drag.handle) {
      case 'move':
        x = Math.max(0, Math.min(1 - w, b.x + dx))
        y = Math.max(0, Math.min(1 - h, b.y + dy))
        break
      case 'tl': {
        const nx = Math.max(0, Math.min(b.x + b.w - MIN, b.x + dx))
        const ny = Math.max(0, Math.min(b.y + b.h - MIN, b.y + dy))
        w = b.x + b.w - nx; h = b.y + b.h - ny; x = nx; y = ny
        break
      }
      case 'tr': {
        const ny = Math.max(0, Math.min(b.y + b.h - MIN, b.y + dy))
        w = Math.max(MIN, Math.min(1 - b.x, b.w + dx)); h = b.y + b.h - ny; y = ny
        break
      }
      case 'bl': {
        const nx = Math.max(0, Math.min(b.x + b.w - MIN, b.x + dx))
        w = b.x + b.w - nx; h = Math.max(MIN, Math.min(1 - b.y, b.h + dy)); x = nx
        break
      }
      case 'br':
        w = Math.max(MIN, Math.min(1 - b.x, b.w + dx))
        h = Math.max(MIN, Math.min(1 - b.y, b.h + dy))
        break
    }
    setCropBox({ x, y, w, h })
  }

  const onPointerUp = () => setDrag(null)

  // ── PDF generation & save ───────────────────────────────────────────────────

  const saveToProperty = async (dr: Dealroom) => {
    if (!docName.trim()) { toast.error('Introdu un nume pentru document'); return }
    setSaving(dr.id)
    try {
      const pdfDoc = await PDFDocument.create()
      for (const dataUrl of pages) {
        const b64 = dataUrl.split(',')[1]
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        const image = dataUrl.includes('image/png')
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes)
        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
      }
      const pdfBytes = await pdfDoc.save()
      const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

      const fileName = `${dr.id}/${Date.now()}-${docName.trim().replace(/\s+/g, '_')}.pdf`
      const { error: upErr } = await supabase.storage
        .from('documente-proprietati')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf' })
      if (upErr) throw new Error(upErr.message)

      const { data: urlData } = supabase.storage.from('documente-proprietati').getPublicUrl(fileName)
      const { error: dbErr } = await supabase.from('documente_scanate').insert({
        dealroom_id: dr.id, agent_id: agentId,
        file_url: urlData.publicUrl, file_name: docName.trim(), nr_pagini: pages.length,
      })
      if (dbErr) throw new Error(dbErr.message)

      toast.success('Document salvat cu succes!')
      setPages([]); setDocName(''); setShowProps(false)
    } catch (err) {
      console.error(err)
      toast.error('Eroare la salvare')
    } finally {
      setSaving(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Main view ── */}
      <div className="max-w-2xl space-y-4">

        {/* Scanned pages — full-width cards */}
        {pages.map((url, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Pagina {i + 1}
              </span>
              <button
                onClick={() => setPages(p => p.filter((_, idx) => idx !== i))}
                className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Șterge pagina"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Pagina ${i + 1}`} className="w-full object-contain" />
          </div>
        ))}

        {/* Drop zone / add page button */}
        <button
          onClick={openCamera}
          className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl py-14 flex flex-col items-center gap-3 transition-colors text-slate-400 hover:text-blue-500"
        >
          <Camera className="w-10 h-10" />
          <span className="text-sm font-medium">
            {pages.length === 0 ? 'Apasă pentru a scana prima pagină' : 'Adaugă încă o pagină'}
          </span>
          {pages.length === 0 && (
            <span className="text-xs text-slate-400">Se va deschide camera</span>
          )}
        </button>

        {/* Alege proprietatea */}
        {pages.length > 0 && (
          <button
            onClick={() => setShowProps(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-base shadow-sm"
          >
            <FileDown className="w-5 h-5" />
            Alege proprietatea
          </button>
        )}
      </div>

      {/* ── Camera fullscreen overlay ── */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/70 flex-shrink-0">
            <button onClick={closeCamera} className="p-1.5 text-white">
              <X className="w-6 h-6" />
            </button>
            <span className="text-white text-sm font-medium">
              {captured ? 'Ajustează & decupează' : 'Fotografiază documentul'}
            </span>
            <div className="w-9" />
          </div>

          {/* Live feed */}
          {!captured && (
            <>
              <div className="flex-1 overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-shrink-0 py-8 flex justify-center bg-black">
                <button
                  onClick={capture}
                  className="rounded-full border-4 border-white flex items-center justify-center"
                  style={{ width: 72, height: 72 }}
                  aria-label="Fotografiază"
                >
                  <div className="rounded-full bg-white" style={{ width: 54, height: 54 }} />
                </button>
              </div>
            </>
          )}

          {/* Crop preview */}
          {captured && (
            <>
              <div
                ref={cropRef}
                className="flex-1 overflow-hidden relative bg-black select-none"
                style={{ touchAction: drag ? 'none' : 'auto' }}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {/* Captured image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={captured}
                  alt="Capturat"
                  className="w-full h-full object-contain"
                  draggable={false}
                />

                {/* Dark overlay with crop hole */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <mask id="cm">
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={`${cropBox.x * 100}%`} y={`${cropBox.y * 100}%`}
                        width={`${cropBox.w * 100}%`} height={`${cropBox.h * 100}%`}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#cm)" />
                  {/* Crop border */}
                  <rect
                    x={`${cropBox.x * 100}%`} y={`${cropBox.y * 100}%`}
                    width={`${cropBox.w * 100}%`} height={`${cropBox.h * 100}%`}
                    fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="6 4"
                  />
                  {/* Rule-of-thirds grid */}
                  {[1, 2].map(n => (
                    <g key={n}>
                      <line
                        x1={`${(cropBox.x + cropBox.w * n / 3) * 100}%`}
                        y1={`${cropBox.y * 100}%`}
                        x2={`${(cropBox.x + cropBox.w * n / 3) * 100}%`}
                        y2={`${(cropBox.y + cropBox.h) * 100}%`}
                        stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"
                      />
                      <line
                        x1={`${cropBox.x * 100}%`}
                        y1={`${(cropBox.y + cropBox.h * n / 3) * 100}%`}
                        x2={`${(cropBox.x + cropBox.w) * 100}%`}
                        y2={`${(cropBox.y + cropBox.h * n / 3) * 100}%`}
                        stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"
                      />
                    </g>
                  ))}
                </svg>

                {/* Move handle (entire crop interior) */}
                <div
                  className="absolute cursor-move"
                  style={{
                    left: `${cropBox.x * 100}%`, top: `${cropBox.y * 100}%`,
                    width: `${cropBox.w * 100}%`, height: `${cropBox.h * 100}%`,
                    touchAction: 'none',
                  }}
                  onPointerDown={e => onPointerDown(e, 'move')}
                />

                {/* Corner handles */}
                {(
                  [
                    ['tl', cropBox.x, cropBox.y, 'nwse-resize'],
                    ['tr', cropBox.x + cropBox.w, cropBox.y, 'nesw-resize'],
                    ['bl', cropBox.x, cropBox.y + cropBox.h, 'nesw-resize'],
                    ['br', cropBox.x + cropBox.w, cropBox.y + cropBox.h, 'nwse-resize'],
                  ] as [string, number, number, string][]
                ).map(([id, lx, ly, cur]) => (
                  <div
                    key={id}
                    className="absolute z-10 bg-white border-2 border-blue-500 rounded-full"
                    style={{
                      width: 28, height: 28,
                      left: `${lx * 100}%`, top: `${ly * 100}%`,
                      transform: 'translate(-50%,-50%)',
                      cursor: cur, touchAction: 'none',
                    }}
                    onPointerDown={e => onPointerDown(e, id)}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex-shrink-0 flex gap-4 px-6 py-5 bg-black">
                <button
                  onClick={retake}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/30 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Refă
                </button>
                <button
                  onClick={usePhoto}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Folosește
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Property selection overlay ── */}
      {showProps && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setShowProps(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Alege proprietatea</h2>
              <p className="text-xs text-slate-400">
                {pages.length} {pages.length === 1 ? 'pagină scanată' : 'pagini scanate'} · se salvează ca PDF
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Document name */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <label className="text-xs font-semibold text-slate-500 block mb-2 uppercase tracking-wide">
                Numele documentului *
              </label>
              <input
                type="text"
                value={docName}
                onChange={e => setDocName(e.target.value)}
                className="input-field"
                placeholder="ex: Extras CF, Schiță, Releveu..."
                autoFocus
              />
            </div>

            {/* Property cards */}
            {dealrooms.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                <ScanLine className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Nicio proprietate activă</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dealrooms.map(dr => (
                  <button
                    key={dr.id}
                    onClick={() => saveToProperty(dr)}
                    disabled={saving !== null}
                    className="w-full bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md p-4 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {EMOJI[dr.tip_proprietate] ?? '🏠'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{dr.adresa_scurta}</p>
                        <p className="text-xs text-slate-400 mt-0.5 capitalize">
                          {dr.tip_proprietate.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {saving === dr.id ? (
                          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                        ) : (
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
