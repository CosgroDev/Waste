'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    if (error) {
      setError(error.message)
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-green-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center mb-3 shadow-lg shadow-green-200">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FridgeFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Reduce waste, eat better</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {magicSent ? (
            <div className="text-center py-4">
              <p className="text-green-700 font-medium">Magic link sent!</p>
              <p className="text-sm text-gray-500 mt-2">Check your email to sign in.</p>
            </div>
          ) : (
            <>
              <div className="flex rounded-lg bg-gray-100 p-1 mb-5">
                <button
                  onClick={() => setMode('password')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === 'password' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}
                >
                  Password
                </button>
                <button
                  onClick={() => setMode('magic')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === 'magic' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}
                >
                  Magic link
                </button>
              </div>

              <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="you@example.com"
                    />
                  </div>
                  {mode === 'password' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="••••••••"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Please wait…' : mode === 'password' ? 'Sign in' : 'Send magic link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          No account?{' '}
          <Link href="/auth/signup" className="text-green-600 font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
