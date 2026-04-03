import { NextResponse } from 'next/server'
import { fetchNews } from '@/lib/news'

export const revalidate = 900 // 15 minutes

export async function GET() {
  try {
    const articles = await fetchNews(15)
    return NextResponse.json(articles)
  } catch (err) {
    console.error('[GET /api/news]', err)
    return NextResponse.json([], { status: 200 })
  }
}
