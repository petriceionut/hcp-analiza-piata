'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Building2, Eye, EyeOff, Lock, Mail, Zap } from 'lucide-react'

const IS_DEV = process.env.NODE_ENV === 'development'

// Isolated so useSearchParams() is inside a Suspense boundary
function DevAutoLogin({ onTrigger }: { onTrigger: () => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (IS_DEV && searchParams.get('dev') === 'true') {
      onTrigger()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function LoginPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [devLoading, setDevLoading]     = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const handleDevLogin = async () => {
    if (!IS_DEV) return
    setDevLoading(true)
    try {
      const res = await fetch('/api/dev-login', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Dev login: ${data.email}`)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      toast.error(`Dev login failed: ${err instanceof Error ? err.message : 'unknown error'}`)
      setDevLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Email sau parolă incorectă')
      setLoading(false)
      return
    }

    toast.success('Bine ai venit!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Suspense boundary required by Next.js for useSearchParams() */}
      <Suspense fallback={null}>
        <DevAutoLogin onTrigger={handleDevLogin} />
      </Suspense>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">HCP</h1>
          <p className="text-blue-300 mt-1 text-sm">Platforma Imobiliara Profesionala</p>
        </div>

        {/* Dev bypass banner */}
        {IS_DEV && (
          <div className="mb-4 bg-amber-500/20 border border-amber-400/40 rounded-xl p-4 text-center">
            <p className="text-amber-300 text-xs font-medium mb-2">
              DEV MODE — bypass autentificare
            </p>
            <button
              type="button"
              onClick={handleDevLogin}
              disabled={devLoading}
              className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-white font-semibold py-2.5 rounded-lg transition-all text-sm"
            >
              <Zap className="w-4 h-4" />
              {devLoading ? 'Se autentifica...' : 'Dev Login (skip parolă)'}
            </button>
            <p className="text-amber-400/60 text-xs mt-2">
              Necesită DEV_TEST_EMAIL + DEV_TEST_PASSWORD în .env.local
            </p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Autentificare Agent</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">
                Adresa de email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-blue-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                  placeholder="agent@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1.5">
                Parola
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-blue-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Se autentifica...
                </>
              ) : (
                'Autentificare'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-400 text-xs mt-6">
          Acces restrictionat — doar agenti autorizati
        </p>
      </div>
    </div>
  )
}
