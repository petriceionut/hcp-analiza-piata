import { fetchNews, NEWS_FALLBACK_IMAGE, type NewsArticle } from '@/lib/news'
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
  let articles: NewsArticle[] = []
  try {
    articles = await fetchNews(15)
  } catch {
    // show empty state
  }

  const [featured, ...rest] = articles

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
        <div className="space-y-6">
          {/* Featured article */}
          {featured && (
            <a
              href={featured.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all"
            >
              {/* Image */}
              <div className="relative h-[300px] overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.image || NEWS_FALLBACK_IMAGE}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = NEWS_FALLBACK_IMAGE }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 pt-10 pb-4 flex items-center gap-2">
                  <span className="text-[11px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {featured.source}
                  </span>
                  <span className="text-xs text-white/80">{relDate(featured.pubDate)}</span>
                </div>
              </div>
              {/* Text */}
              <div className="p-5">
                <h2 className="text-lg font-semibold text-slate-900 leading-snug line-clamp-3 group-hover:underline decoration-blue-500 underline-offset-2 mb-2">
                  {featured.title}
                </h2>
                {featured.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {featured.description}
                  </p>
                )}
              </div>
            </a>
          )}

          {/* Remaining articles grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {rest.map((article, i) => (
                <a
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all flex flex-col"
                >
                  {/* Image */}
                  <div className="h-44 overflow-hidden bg-slate-100 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.image || NEWS_FALLBACK_IMAGE}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = NEWS_FALLBACK_IMAGE }}
                    />
                  </div>
                  {/* Text */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                        {article.source}
                      </span>
                      <span className="text-xs text-slate-400">{relDate(article.pubDate)}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:underline decoration-blue-500 underline-offset-2 flex-1">
                      {article.title}
                    </h3>
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
      )}
    </div>
  )
}
