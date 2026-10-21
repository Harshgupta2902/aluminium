'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserCell } from '@/components/admin/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Phone,
  Mail,
  Building2,
} from 'lucide-react'
import {
  updateLead,
  generateLeadBilling,
  markLeadPaid,
  rejectLead,
} from '../actions'
import type { AdminLeadRow } from '../data'

const STATUS_META: Record<
  AdminLeadRow['status'],
  { label: string; cls: string }
> = {
  new: { label: 'New', cls: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300' },
  contacted: { label: 'Contacted', cls: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300' },
  billing_sent: { label: 'Billing sent', cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300' },
  won: { label: 'Won', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300' },
  rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300' },
}

function LeadStatusPill({ status }: { status: AdminLeadRow['status'] }) {
  const s = STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        s.cls
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {s.label}
    </span>
  )
}

/** Add `months` to an ISO date (yyyy-mm-dd) and return the same format. */
function addInterval(startIso: string, interval: string | null): string {
  const d = new Date(startIso)
  const months = interval === 'yearly' ? 12 : interval === 'quarterly' ? 3 : 1
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function LeadsTable({ leads }: { leads: AdminLeadRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {leads.map((lead) => (
        <Card key={lead.id} className="overflow-hidden">
          <button
            onClick={() => setOpenId(openId === lead.id ? null : lead.id)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <UserCell name={lead.full_name} email={lead.email} />
            </div>
            <div className="hidden text-sm text-muted-foreground sm:block">
              {lead.plan_name ?? '—'}
            </div>
            <div className="hidden text-xs text-muted-foreground md:block">
              {formatDate(lead.created_at)}
            </div>
            <LeadStatusPill status={lead.status} />
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                openId === lead.id && 'rotate-180'
              )}
            />
          </button>

          {openId === lead.id && <LeadDetail lead={lead} />}
        </Card>
      ))}
    </div>
  )
}

function LeadDetail({ lead }: { lead: AdminLeadRow }) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  const [notes, setNotes] = useState(lead.notes ?? '')
  const [status, setStatus] = useState(lead.status)
  const [amount, setAmount] = useState(String(lead.plan_price ?? 0))
  const [limit, setLimit] = useState(
    lead.plan_quotation_limit == null ? '' : String(lead.plan_quotation_limit)
  )
  const [startsAt, setStartsAt] = useState(today)
  const [endsAt, setEndsAt] = useState(addInterval(today, lead.plan_interval))

  const [busy, setBusy] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (key: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setBusy(key)
    setError(null)
    startTransition(async () => {
      const res = await fn()
      setBusy(null)
      if (!res.success) {
        setError(res.error ?? 'Something went wrong.')
        return
      }
      router.refresh()
    })
  }

  const billingDone = lead.status === 'billing_sent' || lead.status === 'won'
  const activated = lead.status === 'won'

  return (
    <div className="space-y-5 border-t border-border bg-muted/20 p-5">
      {/* Contact + status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" /> {lead.email}
          </p>
          {lead.phone && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" /> {lead.phone}
            </p>
          )}
          {lead.company_name && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" /> {lead.company_name}
            </p>
          )}
          <p className="text-muted-foreground">
            Plan: <span className="font-medium text-foreground">{lead.plan_name ?? '—'}</span>
          </p>
        </div>

        {/* Status + notes */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['new', 'contacted'] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? 'default' : 'outline'}
                onClick={() => {
                  setStatus(s)
                  run('status', () => updateLead({ id: lead.id, status: s, notes }))
                }}
                disabled={pending || activated}
              >
                {STATUS_META[s].label}
              </Button>
            ))}
          </div>
          <Field label="Notes">
            <Textarea
              id={`notes-${lead.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Call notes, requirements…"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => run('notes', () => updateLead({ id: lead.id, status, notes }))}
              disabled={pending}
              className="mt-1.5"
            >
              Save notes
            </Button>
          </Field>
        </div>
      </div>

      {/* Billing generation */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-heading">
          <Receipt className="h-4 w-4" />
          Billing
          {activated && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> Paid & activated
            </span>
          )}
        </h4>

        {!activated && (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Amount (₹)">
                <Input
                  id={`amt-${lead.id}`}
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={billingDone}
                  className="h-9"
                />
              </Field>
              <Field label="Quotation limit">
                <Input
                  id={`lim-${lead.id}`}
                  type="number"
                  min={0}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="Unlimited"
                  disabled={billingDone}
                  className="h-9"
                />
              </Field>
              <Field label="Starts">
                <Input
                  id={`start-${lead.id}`}
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  disabled={billingDone}
                  className="h-9"
                />
              </Field>
              <Field label="Ends">
                <Input
                  id={`end-${lead.id}`}
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  disabled={billingDone}
                  className="h-9"
                />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {!billingDone && (
                <Button
                  size="sm"
                  onClick={() =>
                    run('gen', () =>
                      generateLeadBilling({
                        leadId: lead.id,
                        amount: Number(amount) || 0,
                        quotationLimit: limit === '' ? null : Number(limit),
                        startsAt,
                        endsAt,
                        planName: lead.plan_name ?? 'Standard',
                      })
                    )
                  }
                  disabled={pending || !lead.user_id}
                >
                  {busy === 'gen' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                  Generate billing
                </Button>
              )}
              {billingDone && (
                <Button
                  size="sm"
                  onClick={() => run('paid', () => markLeadPaid(lead.id))}
                  disabled={pending}
                >
                  {busy === 'paid' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mark paid &amp; activate
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => run('reject', () => rejectLead(lead.id))}
                disabled={pending}
                className="ml-auto text-destructive hover:text-destructive"
              >
                Reject lead
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Amount {formatCurrency(Number(amount) || 0)} · the account stays locked until you
              mark it paid.
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
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
