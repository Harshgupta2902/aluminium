'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Loader2,
  Plus,
  Check,
  X,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { formatCurrency, sanitizeSearch } from '@/lib/utils'

const PAGE_SIZE = 20

export type AccessoryKind =
  | 'sash'
  | 'interlock'
  | 'handle'
  | 'roller'
  | 'lock'
  | 'hinge'
  | 'mesh'
  | 'mesh_type'
  | 'mesh_sash'
  | 'mesh_clip'
  | 'mesh_handle'
  | 'mesh_slim'
  | 'reinforcement'
  | 'slim_interlock'
  | 'friction_stay'
  | 'common'

export const ACCESSORY_KINDS: { kind: AccessoryKind; label: string }[] = [
  { kind: 'handle', label: 'Handle' },
  { kind: 'roller', label: 'Roller' },
  { kind: 'lock', label: 'Lock' },
  { kind: 'hinge', label: 'Hinge' },
  { kind: 'friction_stay', label: 'Friction Stay / Hinges' },
  { kind: 'mesh', label: 'Mesh' },
  { kind: 'common', label: 'Common' },
]

const KIND_LABEL: Record<string, string> = Object.fromEntries(
  ACCESSORY_KINDS.map((k) => [k.kind, k.label])
)

interface AccessoryRow {
  id: string
  kind: AccessoryKind
  name: string
  code: string | null
  price: number
}

interface Draft {
  name: string
  code: string
  price: string
}

/** Debounce a changing value. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/**
 * Hardware / accessories manager — a single table with server-side pagination
 * (20/page), search by name + code, and a kind filter. Per-row inline edit.
 */
export function AccessoriesManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<AccessoryRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Controls
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 300)
  const [kindFilter, setKindFilter] = useState<string>('')
  const [page, setPage] = useState(0)

  // Row editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>({ name: '', code: '', price: '' })
  const [busyId, setBusyId] = useState<string | null>(null)

  // Add modal
  const [addOpen, setAddOpen] = useState(false)
  const [adding, setAdding] = useState<{ kind: AccessoryKind; name: string; code: string; price: string }>(
    { kind: 'handle', name: '', code: '', price: '' }
  )
  const [addBusy, setAddBusy] = useState(false)

  const closeAdd = () => {
    if (addBusy) return
    setAddOpen(false)
    setAdding({ kind: 'handle', name: '', code: '', price: '' })
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchPage = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('design_accessories')
      .select('id, kind, name, code, price', { count: 'exact' })
      .order('kind', { ascending: true })
      .order('sort_order', { ascending: true })

    if (kindFilter) q = q.eq('kind', kindFilter)
    const s = sanitizeSearch(debouncedSearch)
    if (s) {
      q = q.or(`name.ilike.%${s}%,code.ilike.%${s}%`)
    }
    const from = page * PAGE_SIZE
    q = q.range(from, from + PAGE_SIZE - 1)

    const { data, count, error: err } = await q
    if (err) setError(err.message)
    setRows((data as AccessoryRow[]) ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [supabase, kindFilter, debouncedSearch, page])

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    })()
  }, [supabase])

  // Reset to page 0 when filters change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0)
  }, [debouncedSearch, kindFilter])

  // Modal: Escape to close + lock background scroll.
  useEffect(() => {
    if (!addOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAdd()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpen])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPage()
  }, [fetchPage])

  const startEdit = (r: AccessoryRow) => {
    setError(null)
    setEditingId(r.id)
    setDraft({ name: r.name, code: r.code ?? '', price: String(r.price ?? 0) })
  }
  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id: string) => {
    setBusyId(id)
    setError(null)
    const { error: err } = await supabase
      .from('design_accessories')
      .update({
        name: draft.name.trim(),
        code: draft.code.trim() || null,
        price: Number(draft.price) || 0,
      })
      .eq('id', id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    setEditingId(null)
    await fetchPage()
  }

  const addRow = async () => {
    if (!adding.name.trim()) return
    setAddBusy(true)
    setError(null)
    const { error: err } = await supabase.from('design_accessories').insert([
      {
        kind: adding.kind,
        name: adding.name.trim(),
        code: adding.code.trim() || null,
        price: Number(adding.price) || 0,
        created_by: userId,
      },
    ])
    setAddBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setAddOpen(false)
    setAdding({ kind: 'handle', name: '', code: '', price: '' })
    // After adding, jump to the first page so the new row is findable.
    setPage(0)
    await fetchPage()
  }

  const start = total === 0 ? 0 : page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </p>
      )}

      {/* Toolbar: search + filter (left) · add (right) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            placeholder="Search name or code…"
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <Select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="h-9 w-48"
        >
          <option value="">All types</option>
          {ACCESSORY_KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>
              {k.label}
            </option>
          ))}
        </Select>
        <div className="sm:ml-auto">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Hardware
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm [&_td]:border [&_td]:border-dashed [&_td]:border-border [&_th]:border [&_th]:border-dashed [&_th]:border-border">
            <colgroup>
              <col className="w-40" />
              <col />
              <col className="w-32" />
              <col className="w-28" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Price</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No accessories found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isEditing = editingId === r.id
                  const isBusy = busyId === r.id
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center text-xs text-muted-foreground">
                          {KIND_LABEL[r.kind] ?? r.kind}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-heading">
                        {isEditing ? (
                          <Input
                            autoFocus
                            value={draft.name}
                            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          r.name
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {isEditing ? (
                          <Input
                            value={draft.code}
                            placeholder="—"
                            onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          r.code || '—'
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={draft.price}
                            onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(r.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            className="h-8 w-24"
                          />
                        ) : (
                          <span className="font-mono tabular-nums text-heading">
                            {formatCurrency(r.price)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" onClick={() => saveEdit(r.id)} disabled={isBusy}>
                              {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Save
                            </Button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={isBusy}
                              title="Cancel"
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-heading disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft/50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {start}–{end} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1 || loading}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add Hardware modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeAdd}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-base font-semibold text-heading">Add Hardware</h2>
              <button
                type="button"
                onClick={closeAdd}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-heading"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                void addRow()
              }}
            >
              <div className="space-y-3 px-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <Select
                    value={adding.kind}
                    onChange={(e) => setAdding((a) => ({ ...a, kind: e.target.value as AccessoryKind }))}
                    className="h-9"
                  >
                    {ACCESSORY_KINDS.map((k) => (
                      <option key={k.kind} value={k.kind}>
                        {k.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Name *</label>
                  <Input
                    autoFocus
                    value={adding.name}
                    placeholder="e.g. METRO HANDLE"
                    onChange={(e) => setAdding((a) => ({ ...a, name: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Code</label>
                    <Input
                      value={adding.code}
                      placeholder="optional"
                      onChange={(e) => setAdding((a) => ({ ...a, code: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Price (₹)</label>
                    <Input
                      type="number"
                      value={adding.price}
                      placeholder="0"
                      onChange={(e) => setAdding((a) => ({ ...a, price: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
                <Button type="button" variant="outline" size="sm" onClick={closeAdd} disabled={addBusy}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addBusy || !adding.name.trim()}>
                  {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Hardware
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
