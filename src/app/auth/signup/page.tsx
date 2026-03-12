'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FridgeFlow</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {done ? (
              <div className="text-center py-6">
                <p className="font-medium">Account created!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check your email to confirm, then{' '}
                  <Link href="/auth/login" className="text-primary font-medium hover:underline">
                    sign in
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
