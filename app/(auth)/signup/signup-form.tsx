'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthField } from '@/components/auth/auth-field'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { User, Mail, Lock, Building2, Phone, Loader2, AlertCircle, CheckCircle2, Check } from 'lucide-react'
import { signUpWithPlan } from './actions'

export interface PublicPlan {
  id: string
  name: string
  description: string | null
  price: number
  billing_interval: 'monthly' | 'quarterly' | 'yearly'
  quotation_limit: number | null
}

const INTERVAL_LABEL: Record<string, string> = {
  monthly: '/mo',
  quarterly: '/qtr',
  yearly: '/yr',
}

export function SignupForm({ plans }: { plans: PublicPlan[] }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [planId, setPlanId] = useState(plans[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!planId) {
      setError('Please select a plan.')
      return
    }

    setLoading(true)
    try {
      const res = await signUpWithPlan({
        fullName,
        email,
        password,
        companyName: companyName || null,
        phone: phone || null,
        planId,
      })
      if (!res.success) {
        setError(res.error)
        return
      }
      setDone(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-heading">Request received 🎉</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your account has been created and is under review. Our team will reach
          out to activate it. You can log in now to track your status.
        </p>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Go to login</Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Plan picker */}
      {plans.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Choose a plan</p>
          <div className="grid gap-2">
            {plans.map((p) => {
              const selected = p.id === planId
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPlanId(p.id)}
                  className={cn(
                    'flex items-start justify-between gap-3 rounded-lg border p-3 text-left transition-all',
                    selected
                      ? 'border-primary bg-primary-soft ring-1 ring-primary'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-heading">{p.name}</span>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    {p.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.quotation_limit == null
                        ? 'Unlimited quotations'
                        : `${p.quotation_limit} quotations / period`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-bold text-heading">{formatCurrency(p.price)}</span>
                    <span className="text-xs text-muted-foreground">
                      {INTERVAL_LABEL[p.billing_interval] ?? ''}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <AuthField
        id="fullName"
        label="Full name"
        value={fullName}
        onChange={setFullName}
        placeholder="Jane Doe"
        icon={<User />}
        autoComplete="name"
        disabled={loading}
        required
      />
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
        id="companyName"
        label="Company (optional)"
        value={companyName}
        onChange={setCompanyName}
        placeholder="Acme Windows"
        icon={<Building2 />}
        autoComplete="organization"
        disabled={loading}
      />
      <AuthField
        id="phone"
        label="Phone (optional)"
        value={phone}
        onChange={setPhone}
        placeholder="98765 43210"
        icon={<Phone />}
        autoComplete="tel"
        disabled={loading}
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
          'Create account'
        )}
      </Button>
    </form>
  )
}
