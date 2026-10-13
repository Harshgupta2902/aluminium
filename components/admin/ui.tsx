import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 * KPI stat card
 * ------------------------------------------------------------------ */

type Tone = 'primary' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate'

const TONES: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300',
}

const VALUE_TONES: Record<Tone, string> = {
  primary: 'text-heading',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  rose: 'text-rose-600 dark:text-rose-400',
  amber: 'text-amber-600 dark:text-amber-400',
  violet: 'text-heading',
  slate: 'text-heading',
}

export function AdminStat({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  valueColored = false,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: Tone
  hint?: string
  /** Colour the value with the tone (used for revenue cards). */
  valueColored?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', TONES[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p
        className={cn(
          'mt-3 text-2xl font-bold tracking-tight',
          valueColored ? VALUE_TONES[tone] : 'text-heading'
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Status pill
 * ------------------------------------------------------------------ */

type Status = 'active' | 'inactive' | 'paid' | 'unpaid' | 'expired' | 'none'

const STATUS: Record<Status, { label: string; cls: string }> = {
  active: {
    label: 'Active',
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  },
  inactive: {
    label: 'Inactive',
    cls: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
  },
  paid: {
    label: 'Paid',
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  },
  unpaid: {
    label: 'Unpaid',
    cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  },
  expired: {
    label: 'Expired',
    cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  },
  none: {
    label: '—',
    cls: 'bg-muted text-muted-foreground ring-border',
  },
}

export function StatusPill({ status, label }: { status: Status; label?: string }) {
  const s = STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        s.cls
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? s.label}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * User cell (avatar initials + name/email)
 * ------------------------------------------------------------------ */

const AVATAR_TONES = [
  'bg-primary-soft text-primary',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function toneFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        toneFor(name)
      )}
      style={{ height: size, width: size }}
    >
      {initials(name)}
    </span>
  )
}

export function UserCell({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name || email} />
      <div className="min-w-0">
        <div className="truncate font-medium text-heading">{name || '—'}</div>
        <div className="truncate text-xs text-muted-foreground">{email}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Usage bar (quotations used / limit)
 * ------------------------------------------------------------------ */

export function UsageBar({
  used,
  limit,
}: {
  used: number
  limit: number | null
}) {
  if (limit == null) {
    return (
      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="font-medium text-foreground">{used}</span>
        <span className="text-muted-foreground">/ ∞</span>
      </div>
    )
  }
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const tone =
    pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary'
  return (
    <div className="ml-auto w-28">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{used}</span>
        <span className="text-muted-foreground">/ {limit}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Section heading + empty state
 * ------------------------------------------------------------------ */

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-4 text-sm font-medium text-heading">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
