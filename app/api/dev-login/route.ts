import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const email    = process.env.DEV_TEST_EMAIL
  const password = process.env.DEV_TEST_PASSWORD

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Set DEV_TEST_EMAIL and DEV_TEST_PASSWORD in .env.local' },
      { status: 500 },
    )
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json({ success: true, email: data.user?.email })
}
