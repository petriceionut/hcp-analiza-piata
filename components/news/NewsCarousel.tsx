'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Newspaper } from 'lucide-react'
import type { NewsArticle } from '@/lib/news'

interface Props {
  articles: NewsArticle[]
}

function formatRelativeDate(pubDate: string): string {
  if (!pubDate) return ''
  const d = new Date(pubDate)
  if (isNaN(d.getTime())) return pubDate
  const diff = Date.now() - d.getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'acum câteva minute'
  if (h < 24) return `acum ${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `acum ${days}z`
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
}

export default function NewsCarousel({ articles }: Props) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  const prev = useCallback(() => setIdx(i => (i - 1 + articles.length) % articles.length), [articles.length])
  const next = useCallback(() => setIdx(i => (i + 1) % articles.length), [articles.length])

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (paused || articles.length === 0) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, next, articles.length])

  if (articles.length === 0) return null

  const article = articles[idx]

  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Știri Imobiliare</h3>
        </div>
        <span className="text-xs text-slate-400">{idx + 1} / {articles.length}</span>
      </div>

      {/* Main card */}
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        {/* Image */}
        <div className="relative h-52 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
          {article.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Newspaper className="w-16 h-16 text-slate-300" />
            </div>
          )}
          {/* Source badge */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {article.source}
          </div>
          {/* External link icon */}
          <div className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-xs text-slate-400 mb-1.5">{formatRelativeDate(article.pubDate)}</p>
          <h4 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h4>
          {article.description && (
            <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          )}
        </div>
      </a>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center transition-all hover:scale-110"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-5 h-5 text-slate-700" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center transition-all hover:scale-110"
        aria-label="Următor"
      >
        <ChevronRight className="w-5 h-5 text-slate-700" />
      </button>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 pb-4">
        {articles.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`rounded-full transition-all ${
              i === idx ? 'w-5 h-1.5 bg-blue-600' : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Articol ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
