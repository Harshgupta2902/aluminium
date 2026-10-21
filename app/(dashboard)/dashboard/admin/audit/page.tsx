import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

const PAGE_SIZE = 50

interface AuditRow {
  id: string
  user_email: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  source: string
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

/** Colour accent per action family. */
function actionTone(action: string): string {
  if (action.startsWith('login') || action.startsWith('signup'))
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
  if (action.startsWith('logout'))
    return 'bg-muted text-muted-foreground ring-border'
  if (action.includes('delete'))
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20'
  if (action.includes('email') || action.includes('pdf'))
    return 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20'
  return 'bg-primary-soft text-primary ring-primary/20'
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(0, Number(sp.page) || 0)
  const actionFilter = (sp.action || '').trim()

  const supabase = await createClient()

  let q = supabase
    .from('audit_logs')
    .select('id, user_email, action, entity_type, entity_id, source, metadata, ip_address, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })

  if (actionFilter) q = q.eq('action', actionFilter)
  const from = page * PAGE_SIZE
  q = q.range(from, from + PAGE_SIZE - 1)

  const { data, count } = await q
  const rows = (data as AuditRow[]) ?? []
  const total = count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Distinct action values for the filter chips (small, bounded set).
  const { data: actionRows } = await supabase
    .from('audit_logs')
    .select('action')
    .limit(1000)
  const actions = Array.from(new Set((actionRows ?? []).map((r) => r.action))).sort()

  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams()
    if (over.action ?? actionFilter) p.set('action', String(over.action ?? actionFilter))
    const pg = over.page ?? page
    if (pg) p.set('page', String(pg))
    const s = p.toString()
    return s ? `?${s}` : ''
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-heading">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Every login, logout, email, PDF, and record change across all users.
        </p>
      </div>

      {/* Action filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/dashboard/admin/audit"
          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
            !actionFilter ? 'bg-primary text-primary-foreground ring-primary' : 'bg-card text-muted-foreground ring-border hover:bg-muted'
          }`}
        >
          All
        </Link>
        {actions.map((a) => (
          <Link
            key={a}
            href={`/dashboard/admin/audit${qs({ action: a, page: 0 })}`}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
              actionFilter === a ? 'bg-primary text-primary-foreground ring-primary' : 'bg-card text-muted-foreground ring-border hover:bg-muted'
            }`}
          >
            {a}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Entity</th>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No audit entries{actionFilter ? ` for “${actionFilter}”` : ''}.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                      {formatDate(r.created_at)}{' '}
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 text-xs text-foreground">{r.user_email || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${actionTone(r.action)}`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {r.entity_type ? (
                        <span>
                          {r.entity_type}
                          {r.entity_id ? <span className="opacity-60"> · {r.entity_id.slice(0, 8)}</span> : null}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {r.source}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-2 text-xs text-muted-foreground">
                      {r.metadata ? (
                        <span className="line-clamp-1 font-mono">{JSON.stringify(r.metadata)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {total === 0 ? 0 : from + 1}–{Math.min(from + PAGE_SIZE, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          {page > 0 ? (
            <Link
              href={`/dashboard/admin/audit${qs({ page: page - 1 })}`}
              className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-md border border-border px-3 py-1.5 opacity-40">Previous</span>
          )}
          <span className="px-1">
            {page + 1} / {pageCount}
          </span>
          {page < pageCount - 1 ? (
            <Link
              href={`/dashboard/admin/audit${qs({ page: page + 1 })}`}
              className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-md border border-border px-3 py-1.5 opacity-40">Next</span>
          )}
        </div>
      </div>
    </div>
  )
}
