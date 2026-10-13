'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthField } from '@/components/auth/auth-field'
import { User, Building2, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      })

      if (signupError) {
        setError(signupError.message)
        return
      }

      if (data.user) {
        // Profile is created automatically by the `on_auth_user_created`
        // database trigger (handle_new_user), which reads full_name and
        // company_name from the signUp metadata above.
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
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start designing windows and sending quotations today.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField
            id="fullName"
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Jane Doe"
            icon={<User />}
            autoComplete="name"
            disabled={loading}
            required
          />
          <AuthField
            id="companyName"
            label="Company"
            value={companyName}
            onChange={setCompanyName}
            placeholder="Acme Windows"
            icon={<Building2 />}
            autoComplete="organization"
            disabled={loading}
            required
          />
        </div>

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
          placeholder="At least 6 characters"
          icon={<Lock />}
          autoComplete="new-password"
          disabled={loading}
          required
        />

        <AuthField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your password"
          icon={<Lock />}
          autoComplete="new-password"
          disabled={loading}
          required
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary-hover hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
