'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthField } from '@/components/auth/auth-field'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { logAuthEvent } from '../audit-actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Record the login (best-effort; never blocks navigation).
        void logAuthEvent('login')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {/* Mobile brand mark */}
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-[var(--shadow-primary)]">
          S
        </span>
        <span className="text-lg font-semibold tracking-tight text-heading">
          SoftWindow
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-heading">
          Welcome back 👋
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Log in to access your designs and quotations.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          icon={<Mail />}
          autoComplete="email"
          disabled={loading}
          required
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          icon={<Lock />}
          autoComplete="current-password"
          disabled={loading}
          required
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary-hover hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>

      <div className="mt-6 space-y-4 text-center">
        <div className="text-sm text-muted-foreground">
          Need an account? Contact your administrator to get set up.
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/70">
          <Link href="/terms" className="hover:text-foreground hover:underline">
            Terms &amp; Conditions
          </Link>
          <span className="text-border-strong">•</span>
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Helpline: 879475061, 8826619980
        </p>
      </div>
    </AuthShell>
  )
}
