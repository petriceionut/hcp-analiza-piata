import { XMLParser } from 'fast-xml-parser'

export const NEWS_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80'

export interface NewsArticle {
  title: string
  link: string
  description: string
  pubDate: string
  image: string
  source: string
  timestamp: number
}

const FEEDS: { url: string; source: string }[] = [
  { url: 'https://www.imobiliare.ro/stiri/rss', source: 'Imobiliare.ro' },
  { url: 'https://www.profit.ro/rss/imobiliare', source: 'Profit.ro' },
  { url: 'https://www.zf.ro/rss/imobiliare', source: 'Ziarul Financiar' },
  { url: 'https://www.forbes.ro/feed', source: 'Forbes România' },
  { url: 'https://www.economica.net/feed', source: 'Economica.net' },
  { url: 'https://www.digi24.ro/rss', source: 'Digi24' },
  { url: 'https://stirileprotv.ro/rss', source: 'ProTV Știri' },
  { url: 'https://www.realitatea.net/rss', source: 'Realitatea.net' },
  { url: 'https://www.g4media.ro/feed', source: 'G4Media' },
  { url: 'https://www.hotnews.ro/rss', source: 'HotNews' },
  { url: 'https://www.capital.ro/feed', source: 'Capital.ro' },
  { url: 'https://www.wall-street.ro/rss', source: 'Wall-Street.ro' },
  { url: 'https://www.businessmagazin.ro/feed', source: 'Business Magazin' },
  { url: 'https://www.ziare.com/imobiliare/rss', source: 'Ziare.com' },
  { url: 'https://www.curs-valutar.ro/rss', source: 'Curs-Valutar.ro' },
]

const KEYWORDS = [
  'imobiliar',
  'apartament',
  'casă', 'casa ',
  'teren',
  'proprietate',
  'ipotecă', 'ipoteca',
  'credit imobiliar',
  'dobândă', 'dobanda',
  ' anl ',
  'anre',
  'construcții rezidențiale', 'constructii rezidentiale',
  'autorizație de construire', 'autorizatie de construire',
  'piața imobiliară', 'piata imobiliara',
  'chirie', 'chirii',
  'dezvoltator imobiliar',
  'proiect rezidențial', 'proiect rezidential',
  'bnr dobândă', 'bnr dobanda',
  'tva imobiliar',
  'cadastru',
  'intabulare',
]

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  textNodeName: '#text',
  parseAttributeValue: false,
  trimValues: true,
})

function getText(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  // fast-xml-parser wraps CDATA in __cdata
  if (typeof val === 'object') {
    const o = val as Record<string, unknown>
    if (o['__cdata']) return String(o['__cdata'])
    if (o['#text']) return String(o['#text'])
  }
  return ''
}

function extractImage(item: Record<string, unknown>): string {
  // enclosure with image type
  const enc = item['enclosure'] as Record<string, string> | undefined
  if (enc?.['@_url'] && (enc['@_type'] ?? '').startsWith('image')) return enc['@_url']

  // media:content or media:thumbnail (fast-xml-parser turns : into _)
  const mc = item['media:content'] ?? item['media_content']
  if (mc) {
    const url = (mc as Record<string, string>)['@_url'] ?? ''
    if (url) return url
  }
  const mt = item['media:thumbnail'] ?? item['media_thumbnail']
  if (mt) {
    const url = (mt as Record<string, string>)['@_url'] ?? ''
    if (url) return url
  }

  // image inside description HTML
  const desc = getText(item['description'])
  const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/)
  if (imgMatch) return imgMatch[1]

  return ''
}

const EXCLUDE_KEYWORDS = [
  'nato', 'militar', 'apărare', 'aparare', 'diplomat', 'ministrul de externe',
  'război', 'razboi', 'conflict armat', 'rusia', 'ucraina', 'sua ', 'trump',
  'zelenski', 'alegeri', 'partid', 'parlament', 'guvern', 'ministru',
  'premier', 'presedinte', 'președinte', 'coalitie', 'coaliție',
]

function matchesKeywords(title: string, desc: string): boolean {
  const titleLow = title.toLowerCase()
  const descLow = desc.toLowerCase()

  // Exclude first — if title OR description contains an exclusion term, reject
  const combined = titleLow + ' ' + descLow
  if (EXCLUDE_KEYWORDS.some(kw => combined.includes(kw))) return false

  // Require a match in BOTH title checked first, then description as fallback
  return KEYWORDS.some(kw => titleLow.includes(kw)) ||
    KEYWORDS.some(kw => descLow.includes(kw))
}

async function fetchFeed(feed: { url: string; source: string }): Promise<NewsArticle[]> {
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HCP-News/1.0)' },
      next: { revalidate: 900 },
    })
    clearTimeout(tid)
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = parser.parse(xml)

    // Support RSS 2.0 and Atom
    let items: Record<string, unknown>[] = []
    const channel = parsed?.rss?.channel
    if (channel) {
      const raw = channel.item
      items = Array.isArray(raw) ? raw : raw ? [raw] : []
    } else {
      const feed2 = parsed?.feed
      if (feed2) {
        const raw = feed2.entry
        items = Array.isArray(raw) ? raw : raw ? [raw] : []
      }
    }

    const articles: NewsArticle[] = []
    for (const item of items) {
      const title = getText(item['title'])
      const description = getText(item['description'] ?? item['summary'] ?? item['content'])
        .replace(/<[^>]+>/g, '') // strip HTML tags
        .slice(0, 300)
      const rawLink = item['link']
      const link = typeof rawLink === 'string'
        ? rawLink
        : (rawLink as Record<string, string> | undefined)?.['@_href'] ?? getText(rawLink as unknown)
      const pubDateStr = getText(item['pubDate'] ?? item['published'] ?? item['dc:date'] ?? item['updated'])
      const timestamp = pubDateStr ? new Date(pubDateStr).getTime() : 0

      if (!title || !link) continue
      if (!matchesKeywords(title, description)) continue

      articles.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        link,
        description,
        pubDate: pubDateStr,
        image: extractImage(item),
        source: feed.source,
        timestamp: isNaN(timestamp) ? 0 : timestamp,
      })
    }
    return articles
  } catch {
    clearTimeout(tid)
    return []
  }
}

export async function fetchNews(max = 15): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed))
  const all: NewsArticle[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }
  // Sort by date descending, deduplicate by link
  const seen = new Set<string>()
  return all
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter(a => {
      if (seen.has(a.link)) return false
      seen.add(a.link)
      return true
    })
    .slice(0, max)
}
