'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { NewsArticle } from '@/lib/news'
import { NEWS_FALLBACK_IMAGE } from '@/lib/news'

interface Props {
  articles: NewsArticle[]
}

function relDate(pubDate: string): string {
  if (!pubDate) return ''
  const d = new Date(pubDate)
  if (isNaN(d.getTime())) return ''
  const h = Math.floor((Date.now() - d.getTime()) / 3600000)
  if (h < 1) return 'acum câteva min'
  if (h < 24) return `acum ${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `acum ${days}z`
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
}

function ArticleImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || NEWS_FALLBACK_IMAGE}
      alt={alt}
      className={className}
      onError={e => { (e.currentTarget as HTMLImageElement).src = NEWS_FALLBACK_IMAGE }}
    />
  )
}

export default function NewsDashboardGrid({ articles }: Props) {
  if (articles.length === 0) return null

  const [featured, ...rest] = articles
  const smallCards = rest.slice(0, 4)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-700">Știri Imobiliare</h3>
        <Link
          href="/stiri"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Vezi toate
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Featured card */}
      <a
        href={featured.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-xl overflow-hidden border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all mb-5"
      >
        {/* Image */}
        <div className="relative h-[300px] overflow-hidden bg-slate-100">
          <ArticleImage
            src={featured.image}
            alt={featured.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Overlay: source + date */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3 flex items-center gap-2">
            <span className="text-[11px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
              {featured.source}
            </span>
            <span className="text-xs text-white/80">{relDate(featured.pubDate)}</span>
          </div>
        </div>
        {/* Text */}
        <div className="p-4">
          <h2 className="text-base font-semibold text-slate-900 leading-snug line-clamp-3 group-hover:underline decoration-blue-500 underline-offset-2 mb-2">
            {featured.title}
          </h2>
          {featured.description && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {featured.description}
            </p>
          )}
        </div>
      </a>

      {/* 4 smaller cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {smallCards.map((article, i) => (
          <a
            key={i}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl overflow-hidden border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all"
          >
            {/* Image */}
            <div className="h-[140px] overflow-hidden bg-slate-100 flex-shrink-0">
              <ArticleImage
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {/* Text */}
            <div className="p-3 flex flex-col flex-1">
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                  {article.source}
                </span>
                <span className="text-[10px] text-slate-400">{relDate(article.pubDate)}</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:underline decoration-blue-500 underline-offset-2">
                {article.title}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
