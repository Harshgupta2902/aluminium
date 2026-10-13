'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, Plus, Check, ShieldHalf } from 'lucide-react'
import { updateUserAccount, addBillingPeriod, setBillingPaid } from '../../actions'

interface Profile {
  id: string
  email: string
  full_name: string
  company_name: string | null
  phone: string | null
  is_active: boolean
  can_access_designs: boolean
  can_access_billing: boolean
  can_access_inventory: boolean
}

interface Period {
  id: string
  plan_name: string
  amount: number
  starts_at: string
  ends_at: string
  quotation_limit: number | null
  is_paid: boolean
  notes: string | null
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function ManageUser({
  profile,
  periods,
}: {
  profile: Profile
  periods: Period[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Profile fields.
  const [fullName, setFullName] = useState(profile.full_name)
  const [companyName, setCompanyName] = useState(profile.company_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')

  const saveProfile = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateUserAccount({
        id: profile.id,
        fullName,
        companyName: companyName || null,
        phone: phone || null,
      })
      if (!res.success) setError(res.error)
      else router.refresh()
    })
  }

  // New billing period form.
  const today = new Date().toISOString().slice(0, 10)
  const [planName, setPlanName] = useState('Standard')
  const [amount, setAmount] = useState('0')
  const [limit, setLimit] = useState('50')
  const [unlimited, setUnlimited] = useState(false)
  const [startsAt, setStartsAt] = useState(today)
  const [endsAt, setEndsAt] = useState(() => addMonths(today, 1))
  const [paid, setPaid] = useState(false)

  const addPeriod = () => {
    setError(null)
    startTransition(async () => {
      const res = await addBillingPeriod({
        userId: profile.id,
        planName,
        amount: Number(amount) || 0,
        quotationLimit: unlimited ? null : Number(limit) || 0,
        startsAt,
        endsAt,
        isPaid: paid,
        notes: null,
      })
      if (!res.success) setError(res.error)
      else router.refresh()
    })
  }

  const togglePaid = (periodId: string, next: boolean) => {
    startTransition(async () => {
      const res = await setBillingPaid(periodId, profile.id, next)
      if (!res.success) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </div>
      )}

      {/* Profile */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Profile</CardTitle>
          <Button size="sm" onClick={saveProfile} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Company">
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={profile.email} disabled />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <ShieldHalf className="h-4 w-4" />
              Account {profile.is_active ? 'active' : 'inactive'} · manage access on the permissions page
            </span>
            <Link
              href="/dashboard/admin/permissions"
              className="font-medium text-primary hover:underline"
            >
              Permissions
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Billing periods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing periods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {periods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No billing periods yet.</p>
          ) : (
            <div className="space-y-2">
              {periods.map((p) => {
                const active = p.starts_at <= today && p.ends_at >= today
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-heading">{p.plan_name}</span>
                        {active && (
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.starts_at)} → {formatDate(p.ends_at)} ·{' '}
                        {p.quotation_limit == null ? 'Unlimited' : `${p.quotation_limit} quotations`} ·{' '}
                        {formatCurrency(p.amount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => togglePaid(p.id, !p.is_paid)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        p.is_paid
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      }`}
                    >
                      {p.is_paid ? 'Paid' : 'Unpaid'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add period */}
          <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Add / renew period
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Plan">
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} className="h-9" />
              </Field>
              <Field label="Amount (₹)">
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9" />
              </Field>
              <Field label="Starts">
                <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="h-9" />
              </Field>
              <Field label="Ends">
                <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="h-9" />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Field label="Quotation limit">
                <Input
                  type="number"
                  min={0}
                  value={limit}
                  disabled={unlimited}
                  onChange={(e) => setLimit(e.target.value)}
                  className="h-9 w-32"
                />
              </Field>
              <label className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="h-4 w-4 accent-primary" />
                Unlimited
              </label>
              <label className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4 accent-primary" />
                Paid
              </label>
            </div>
            <Button size="sm" onClick={addPeriod} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add period
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
