'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { StatusPill } from '@/components/admin/ui'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Check } from 'lucide-react'
import { savePlan, setPlanActive, deletePlan, type PlanRow } from '../actions'

const INTERVAL_LABEL: Record<string, string> = {
  monthly: '/mo',
  quarterly: '/qtr',
  yearly: '/yr',
}

type Draft = {
  id?: string
  name: string
  description: string
  price: string
  billingInterval: 'monthly' | 'quarterly' | 'yearly'
  quotationLimit: string // '' = unlimited
  canAccessDesigns: boolean
  canAccessBilling: boolean
  canAccessInventory: boolean
  isActive: boolean
  isPublic: boolean
  sortOrder: string
}

const emptyDraft = (sortOrder: number): Draft => ({
  name: '',
  description: '',
  price: '0',
  billingInterval: 'monthly',
  quotationLimit: '',
  canAccessDesigns: true,
  canAccessBilling: true,
  canAccessInventory: true,
  isActive: true,
  isPublic: true,
  sortOrder: String(sortOrder),
})

const toDraft = (p: PlanRow): Draft => ({
  id: p.id,
  name: p.name,
  description: p.description ?? '',
  price: String(p.price),
  billingInterval: p.billing_interval,
  quotationLimit: p.quotation_limit == null ? '' : String(p.quotation_limit),
  canAccessDesigns: p.can_access_designs,
  canAccessBilling: p.can_access_billing,
  canAccessInventory: p.can_access_inventory,
  isActive: p.is_active,
  isPublic: p.is_public,
  sortOrder: String(p.sort_order),
})

export function PlansManager({ plans }: { plans: PlanRow[] }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const openNew = () => {
    setError(null)
    setDraft(emptyDraft(plans.length + 1))
  }
  const openEdit = (p: PlanRow) => {
    setError(null)
    setDraft(toDraft(p))
  }

  const save = () => {
    if (!draft) return
    setError(null)
    startTransition(async () => {
      const res = await savePlan({
        id: draft.id,
        name: draft.name,
        description: draft.description || null,
        price: Number(draft.price) || 0,
        billingInterval: draft.billingInterval,
        quotationLimit: draft.quotationLimit === '' ? null : Number(draft.quotationLimit),
        canAccessDesigns: draft.canAccessDesigns,
        canAccessBilling: draft.canAccessBilling,
        canAccessInventory: draft.canAccessInventory,
        isActive: draft.isActive,
        isPublic: draft.isPublic,
        sortOrder: Number(draft.sortOrder) || 0,
      })
      if (!res.success) {
        setError(res.error)
        return
      }
      setDraft(null)
      router.refresh()
    })
  }

  const toggleActive = (p: PlanRow) => {
    setBusyId(p.id)
    startTransition(async () => {
      await setPlanActive(p.id, !p.is_active)
      setBusyId(null)
      router.refresh()
    })
  }

  const remove = (p: PlanRow) => {
    if (!confirm(`Delete the "${p.name}" plan? This cannot be undone.`)) return
    setBusyId(p.id)
    startTransition(async () => {
      const res = await deletePlan(p.id)
      if (!res.success) alert(res.error)
      setBusyId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {!draft && (
        <div className="flex justify-end">
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            New plan
          </Button>
        </div>
      )}

      {/* Editor */}
      {draft && (
        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-heading">
            {draft.id ? 'Edit plan' : 'New plan'}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Name">
                <Input
                  id="pl-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Business"
                  className="h-9"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea
                  id="pl-desc"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="For growing window & door businesses."
                  rows={2}
                />
              </Field>
            </div>
            <Field label="Price (₹)">
              <Input
                id="pl-price"
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                className="h-9"
              />
            </Field>
            <Field label="Billing interval">
              <Select
                id="pl-interval"
                value={draft.billingInterval}
                onChange={(e) =>
                  setDraft({ ...draft, billingInterval: e.target.value as Draft['billingInterval'] })
                }
                className="h-9"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </Field>
            <Field label="Quotation limit">
              <Input
                id="pl-limit"
                type="number"
                min={0}
                value={draft.quotationLimit}
                onChange={(e) => setDraft({ ...draft, quotationLimit: e.target.value })}
                placeholder="Leave empty for unlimited"
                className="h-9"
              />
            </Field>
            <Field label="Sort order">
              <Input
                id="pl-sort"
                type="number"
                min={0}
                value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
                className="h-9"
              />
            </Field>
          </div>

          {/* Feature flags + visibility */}
          <div className="flex flex-wrap gap-4">
            <Checkbox
              label="Designs"
              checked={draft.canAccessDesigns}
              onChange={(v) => setDraft({ ...draft, canAccessDesigns: v })}
            />
            <Checkbox
              label="Billing"
              checked={draft.canAccessBilling}
              onChange={(v) => setDraft({ ...draft, canAccessBilling: v })}
            />
            <Checkbox
              label="Inventory"
              checked={draft.canAccessInventory}
              onChange={(v) => setDraft({ ...draft, canAccessInventory: v })}
            />
            <Checkbox
              label="Active"
              checked={draft.isActive}
              onChange={(v) => setDraft({ ...draft, isActive: v })}
            />
            <Checkbox
              label="Show on signup"
              checked={draft.isPublic}
              onChange={(v) => setDraft({ ...draft, isPublic: v })}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={save} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {draft.id ? 'Save changes' : 'Create plan'}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={pending}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* List */}
      {plans.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-heading">{p.name}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.quotation_limit == null
                      ? 'Unlimited quotations'
                      : `${p.quotation_limit} quotations / period`}
                  </p>
                </div>
                <StatusPill status={p.is_active ? 'active' : 'inactive'} />
              </div>
              {p.description && (
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
              )}
              <div className="mt-3">
                <span className="text-xl font-bold text-heading">{formatCurrency(p.price)}</span>
                <span className="text-xs text-muted-foreground">
                  {INTERVAL_LABEL[p.billing_interval] ?? ''}
                </span>
                {!p.is_public && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Hidden
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(p)}
                  disabled={busyId === p.id}
                >
                  {p.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => remove(p)}
                  disabled={busyId === p.id}
                  className="ml-auto text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  )
}
