'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Check, X, Pencil, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const PAGE_SIZE = 20

interface GlassRow {
  id: string
  name: string
  rate_per_sqft: number
}

interface Draft {
  name: string
  rate: string
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
 * Glass types manager — single table with server-side pagination (20/page),
 * search by name, per-row inline edit, and an Add modal. No delete.
 */
export function GlassManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<GlassRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 300)
  const [page, setPage] = useState(0)

  // Row editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>({ name: '', rate: '' })
  const [busyId, setBusyId] = useState<string | null>(null)

  // Add modal
  const [addOpen, setAddOpen] = useState(false)
  const [adding, setAdding] = useState<{ name: string; rate: string }>({ name: '', rate: '' })
  const [addBusy, setAddBusy] = useState(false)

  const closeAdd = () => {
    if (addBusy) return
    setAddOpen(false)
    setAdding({ name: '', rate: '' })
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchPage = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('design_glasses')
      .select('id, name, rate_per_sqft', { count: 'exact' })
      .order('sort_order', { ascending: true })

    if (debouncedSearch.trim()) q = q.ilike('name', `%${debouncedSearch.trim()}%`)
    const from = page * PAGE_SIZE
    q = q.range(from, from + PAGE_SIZE - 1)

    const { data, count, error: err } = await q
    if (err) setError(err.message)
    setRows((data as GlassRow[]) ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [supabase, debouncedSearch, page])

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    })()
  }, [supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0)
  }, [debouncedSearch])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPage()
  }, [fetchPage])

  // Modal: Escape to close + lock scroll.
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

  const startEdit = (r: GlassRow) => {
    setError(null)
    setEditingId(r.id)
    setDraft({ name: r.name, rate: String(r.rate_per_sqft ?? 0) })
  }
  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id: string) => {
    setBusyId(id)
    setError(null)
    const { error: err } = await supabase
      .from('design_glasses')
      .update({ name: draft.name.trim(), rate_per_sqft: Number(draft.rate) || 0 })
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
    const { error: err } = await supabase.from('design_glasses').insert([
      {
        name: adding.name.trim(),
        rate_per_sqft: Number(adding.rate) || 0,
        created_by: userId,
      },
    ])
    setAddBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setAddOpen(false)
    setAdding({ name: '', rate: '' })
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

      {/* Toolbar: search (left) · add (right) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            placeholder="Search glass type…"
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <div className="sm:ml-auto">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Glass
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm [&_td]:border [&_td]:border-dashed [&_td]:border-border [&_th]:border [&_th]:border-dashed [&_th]:border-border">
            <colgroup>
              <col className="w-30" />
              <col className="w-20" />
              <col className="w-18" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Price / Sqft</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No glass types found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isEditing = editingId === r.id
                  const isBusy = busyId === r.id
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-muted/30">
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
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={draft.rate}
                            onChange={(e) => setDraft((d) => ({ ...d, rate: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(r.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            className="h-8 w-28"
                          />
                        ) : (
                          <span className="font-mono tabular-nums text-heading">
                            {formatCurrency(r.rate_per_sqft)}
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

      {/* Add Glass modal */}
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
              <h2 className="text-base font-semibold text-heading">Add Glass</h2>
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
                  <label className="text-xs font-medium text-muted-foreground">Name *</label>
                  <Input
                    autoFocus
                    value={adding.name}
                    placeholder="e.g. 5MM CLEAR TOUGHENED GLASS"
                    onChange={(e) => setAdding((a) => ({ ...a, name: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Price / Sqft (₹)</label>
                  <Input
                    type="number"
                    value={adding.rate}
                    placeholder="0"
                    onChange={(e) => setAdding((a) => ({ ...a, rate: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
                <Button type="button" variant="outline" size="sm" onClick={closeAdd} disabled={addBusy}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addBusy || !adding.name.trim()}>
                  {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Glass
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
