'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/dashboard/page-header'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { createUserAccount } from '../../actions'

function randomPassword(len = 10): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#$'
  let out = ''
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length]
  return out
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export default function NewUserPage() {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(() => randomPassword())
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [canDesigns, setCanDesigns] = useState(true)
  const [canBilling, setCanBilling] = useState(true)
  const [canInventory, setCanInventory] = useState(true)

  const [planName, setPlanName] = useState('Standard')
  const [amount, setAmount] = useState('0')
  const [quotationLimit, setQuotationLimit] = useState('50')
  const [unlimited, setUnlimited] = useState(false)
  const [startsAt, setStartsAt] = useState(today)
  const [endsAt, setEndsAt] = useState(() => addMonths(today, 1))
  const [isPaid, setIsPaid] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    const res = await createUserAccount({
      fullName,
      email,
      password,
      companyName: companyName || null,
      phone: phone || null,
      canAccessDesigns: canDesigns,
      canAccessBilling: canBilling,
      canAccessInventory: canInventory,
      planName,
      amount: Number(amount) || 0,
      quotationLimit: unlimited ? null : Number(quotationLimit) || 0,
      startsAt,
      endsAt,
      isPaid,
    })

    setLoading(false)
    if (!res.success) {
      setError(res.error)
      return
    }
    if (res.warning) {
      setNotice(res.warning)
      setTimeout(() => router.push(`/dashboard/admin/users/${res.userId}`), 1500)
      return
    }
    router.push(`/dashboard/admin/users/${res.userId}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Add User" description="Create an account and email the login details.">
        <Link href="/dashboard/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Users
          </Button>
        </Link>
      </PageHeader>

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
          {notice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name *">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </Field>
              <Field label="Company">
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </Field>
              <Field label="Email *">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
            </div>
            <Field label="Temporary Password *">
              <div className="flex gap-2">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button type="button" variant="outline" onClick={() => setPassword(randomPassword())} title="Generate">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Emailed to the user; they can change it after login.</p>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Toggle label="Can access Designs" checked={canDesigns} onChange={setCanDesigns} />
            <Toggle label="Can access Billing" checked={canBilling} onChange={setCanBilling} />
            <Toggle label="Can access Inventory" checked={canInventory} onChange={setCanInventory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Plan name">
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
              </Field>
              <Field label="Amount (₹)">
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Starts">
                <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </Field>
              <Field label="Ends (expiry)">
                <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </Field>
            </div>
            <Field label="Quotation limit (this period)">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  value={quotationLimit}
                  disabled={unlimited}
                  onChange={(e) => setQuotationLimit(e.target.value)}
                  className="max-w-40"
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="h-4 w-4 accent-primary" />
                  Unlimited
                </label>
              </div>
            </Field>
            <Toggle label="Marked as paid" checked={isPaid} onChange={setIsPaid} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create & Email Credentials'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
      <span className="text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
    </label>
  )
}
