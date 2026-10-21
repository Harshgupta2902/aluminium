'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Check, Pencil, X, ShieldCheck } from 'lucide-react'

export interface ProfileData {
  id: string
  email: string
  full_name: string
  company_name: string | null
  phone: string | null
  role: string
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
  sales: 'Sales',
  accounts: 'Accounts',
}

/**
 * Self-service profile — view details and edit the safe fields
 * (name / company / phone). Email and role are read-only; the per-user access
 * flags and role are superadmin-controlled and enforced by RLS.
 */
export function ProfileManager({ profile }: { profile: ProfileData }) {
  const supabase = createClient()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(profile.full_name)
  const [company, setCompany] = useState(profile.company_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')

  const cancel = () => {
    setFullName(profile.full_name)
    setCompany(profile.company_name ?? '')
    setPhone(profile.phone ?? '')
    setEditing(false)
    setError(null)
  }

  const save = async () => {
    if (!fullName.trim()) {
      setError('Name is required.')
      return
    }
    setSaving(true)
    setSaved(false)
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        company_name: company.trim() || null,
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setSaved(true)
    setEditing(false)
    router.refresh()
  }

  const initial = (fullName || profile.email).charAt(0).toUpperCase()

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Identity header */}
      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-2xl font-semibold text-white shadow-[var(--shadow-primary)]">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-heading">{profile.full_name}</p>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
              <ShieldCheck className="h-3 w-3" />
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
          <CardTitle className="text-base">Profile Details</CardTitle>
          {!editing ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancel} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
              {error}
            </p>
          )}
          {saved && !editing && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
              Profile updated.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              {editing ? (
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-9" />
              ) : (
                <p className="text-sm font-medium text-heading">{profile.full_name || '—'}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              {editing ? (
                <Input value={company} onChange={(e) => setCompany(e.target.value)} className="h-9" placeholder="Company name" />
              ) : (
                <p className="text-sm font-medium text-heading">{profile.company_name || '—'}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              {editing ? (
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" placeholder="Phone number" />
              ) : (
                <p className="text-sm font-medium text-heading">{profile.phone || '—'}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <p className="text-sm font-medium text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
            Email and role can&apos;t be changed here. Contact your administrator to update account
            access or role.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
