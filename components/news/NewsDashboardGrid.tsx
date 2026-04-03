'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { NewsArticle } from '@/lib/news'
import { NEWS_FALLBACK_IMAGE } from '@/lib/news'

interface Props {
  articles: NewsArticle[]  // expects first 6
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

export default function NewsDashboardGrid({ articles }: Props) {
  if (articles.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Știri Imobiliare</h3>
        <Link
          href="/stiri"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Vezi toate
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.slice(0, 6).map((article, i) => (
          <a
            key={i}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm p-3 transition-all"
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.image || NEWS_FALLBACK_IMAGE}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={e => { (e.currentTarget as HTMLImageElement).src = NEWS_FALLBACK_IMAGE }}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-semibold text-blue-600 truncate max-w-[80px]">
                  {article.source}
                </span>
                <span className="text-[10px] text-slate-400 flex-shrink-0">{relDate(article.pubDate)}</span>
              </div>
              <p className="text-xs font-medium text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                {article.title}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
