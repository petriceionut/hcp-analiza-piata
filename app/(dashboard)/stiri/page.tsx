import { fetchNews, type NewsArticle } from '@/lib/news'
import StiriClient from '@/components/news/StiriClient'

export default async function StiriPage() {
  let articles: NewsArticle[] = []
  try {
    articles = await fetchNews(15)
  } catch {
    // show empty state
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Știri Imobiliare</h1>
        <p className="text-slate-500 text-sm mt-1">
          Cele mai recente știri din piața imobiliară românească
        </p>
      </div>
      <StiriClient articles={articles} />
    </div>
  )
}
