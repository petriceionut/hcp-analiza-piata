import { fetchNews, NEWS_FALLBACK_IMAGE } from '@/lib/news'
import { Newspaper } from 'lucide-react'

function relDate(pubDate: string): string {
  if (!pubDate) return ''
  const d = new Date(pubDate)
  if (isNaN(d.getTime())) return ''
  const h = Math.floor((Date.now() - d.getTime()) / 3600000)
  if (h < 1) return 'acum câteva minute'
  if (h < 24) return `acum ${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `acum ${days}z`
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function StiriPage() {
  const articles = await fetchNews(15)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Știri Imobiliare</h1>
        <p className="text-slate-500 text-sm mt-1">
          Cele mai recente știri din piața imobiliară românească
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Nu s-au putut încărca știrile. Încearcă din nou mai târziu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all flex flex-col"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image || NEWS_FALLBACK_IMAGE}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = NEWS_FALLBACK_IMAGE }}
                />
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {article.source}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-slate-400 mb-1.5">{relDate(article.pubDate)}</p>
                <h2 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors flex-1">
                  {article.title}
                </h2>
                {article.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {article.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
