'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Plus,
  Check,
  X,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { WINDOW_TYPE_MAP } from '@/lib/design-editor/frame-model'
import { sanitizeSearch } from '@/lib/utils'

const PAGE_SIZE = 20

/** Debounce a changing value. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/* ================================================================== *
 * Colours
 * ================================================================== */

interface ColorRow {
  id: string
  name: string
  hex: string | null
}

function ColoursTable() {
  const supabase = createClient()
  const [rows, setRows] = useState<ColorRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 300)
  const [page, setPage] = useState(0)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ name: string; hex: string }>({ name: '', hex: '' })
  const [busyId, setBusyId] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [adding, setAdding] = useState<{ name: string; hex: string }>({ name: '', hex: '#cccccc' })
  const [addBusy, setAddBusy] = useState(false)

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const refresh = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('design_colors')
      .select('id, name, hex', { count: 'exact' })
      .order('sort_order', { ascending: true })
    const s = sanitizeSearch(debouncedSearch)
    if (s) q = q.ilike('name', `%${s}%`)
    const from = page * PAGE_SIZE
    q = q.range(from, from + PAGE_SIZE - 1)

    const { data, count, error: err } = await q
    if (err) setError(err.message)
    setRows((data as ColorRow[]) ?? [])
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
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!addOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !addBusy) setAddOpen(false)
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

  const startEdit = (r: ColorRow) => {
    setError(null)
    setEditingId(r.id)
    setDraft({ name: r.name, hex: r.hex ?? '' })
  }

  const saveEdit = async (id: string) => {
    setBusyId(id)
    const { error: err } = await supabase
      .from('design_colors')
      .update({ name: draft.name.trim(), hex: draft.hex.trim() || null })
      .eq('id', id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    setEditingId(null)
    await refresh()
  }

  const addRow = async () => {
    if (!adding.name.trim()) return
    setAddBusy(true)
    const { error: err } = await supabase
      .from('design_colors')
      .insert([{ name: adding.name.trim(), hex: adding.hex.trim() || null, created_by: userId }])
    setAddBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setAddOpen(false)
    setAdding({ name: '', hex: '#cccccc' })
    setPage(0)
    await refresh()
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-heading">Colours</h3>
        <p className="text-xs text-muted-foreground">Window colours shown in the designer.</p>
      </div>

      {/* Toolbar: search (left) · add (right) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            placeholder="Search colour…"
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <div className="sm:ml-auto">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Colour
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm [&_td]:border [&_td]:border-dashed [&_td]:border-border [&_th]:border [&_th]:border-dashed [&_th]:border-border">
            <colgroup>
              <col className="w-16" />
              <col className="w-32" />
              <col className="w-32" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 text-center">Swatch</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Hex</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No colours yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isEditing = editingId === r.id
                  const isBusy = busyId === r.id
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <span
                          className="mx-auto block h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: (isEditing ? draft.hex : r.hex) || '#ffffff' }}
                        />
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
                            value={draft.hex}
                            placeholder="#rrggbb"
                            onChange={(e) => setDraft((d) => ({ ...d, hex: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(r.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            className="h-8 w-28 font-mono"
                          />
                        ) : (
                          <span className="font-mono text-xs">{r.hex || '—'}</span>
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
                              onClick={() => setEditingId(null)}
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
          {total === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
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

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !addBusy && setAddOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-base font-semibold text-heading">Add Colour</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
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
                    placeholder="e.g. Anthracite Grey"
                    onChange={(e) => setAdding((a) => ({ ...a, name: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(adding.hex) ? adding.hex : '#cccccc'}
                      onChange={(e) => setAdding((a) => ({ ...a, hex: e.target.value }))}
                      className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent"
                    />
                    <Input
                      value={adding.hex}
                      placeholder="#rrggbb"
                      onChange={(e) => setAdding((a) => ({ ...a, hex: e.target.value }))}
                      className="h-9 flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)} disabled={addBusy}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addBusy || !adding.name.trim()}>
                  {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Colour
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

/* ================================================================== *
 * Fallback pricing: GST / Install + base rate per window type
 * ================================================================== */

interface RateRow {
  id: string
  window_type: string
  base_rate: number
  sort_order: number
}

function FallbackPricing() {
  const supabase = createClient()
  const [rates, setRates] = useState<RateRow[]>([])
  const [gst, setGst] = useState('18')
  const [install, setInstall] = useState('10')
  const [loading, setLoading] = useState(true)
  const [savingCfg, setSavingCfg] = useState(false)
  const [cfgSaved, setCfgSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [rateRes, cfgRes] = await Promise.all([
      supabase.from('design_type_rates').select('*').order('sort_order'),
      supabase.from('design_pricing_config').select('*').eq('id', 1).maybeSingle(),
    ])
    setRates((rateRes.data as RateRow[]) ?? [])
    if (cfgRes.data) {
      setGst(String(cfgRes.data.gst_percentage))
      setInstall(String(cfgRes.data.install_percentage))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const saveConfig = async () => {
    setSavingCfg(true)
    setCfgSaved(false)
    setError(null)
    const { error: ce } = await supabase
      .from('design_pricing_config')
      .update({ gst_percentage: Number(gst), install_percentage: Number(install) })
      .eq('id', 1)
    setSavingCfg(false)
    if (ce) setError(ce.message)
    else setCfgSaved(true)
  }

  const saveRate = async (id: string) => {
    setBusyId(id)
    const { error: e } = await supabase
      .from('design_type_rates')
      .update({ base_rate: Number(draft) || 0 })
      .eq('id', id)
    setBusyId(null)
    if (e) {
      setError(e.message)
      return
    }
    setRates((prev) => prev.map((r) => (r.id === id ? { ...r, base_rate: Number(draft) || 0 } : r)))
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading pricing...
      </div>
    )
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-heading">Fallback pricing</h3>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </p>
      )}

      {/* GST / Install */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">GST %</label>
          <Input type="number" value={gst} onChange={(e) => setGst(e.target.value)} className="h-9 w-28" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Install %</label>
          <Input type="number" value={install} onChange={(e) => setInstall(e.target.value)} className="h-9 w-28" />
        </div>
        <Button size="sm" onClick={saveConfig} disabled={savingCfg}>
          {savingCfg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {cfgSaved ? 'Saved' : 'Save'}
        </Button>
      </div>

      {/* Base rate per window type */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/30 px-4 py-2.5">
          <h4 className="text-sm font-semibold text-heading">Base rate per window type</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm [&_td]:border [&_td]:border-dashed [&_td]:border-border [&_th]:border [&_th]:border-dashed [&_th]:border-border">
            <colgroup>
              <col />
              <col className="w-40" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">Window Type</th>
                <th className="px-4 py-2.5">Base Rate (₹/sqft)</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => {
                const isEditing = editingId === r.id
                const isBusy = busyId === r.id
                return (
                  <tr key={r.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium text-heading">
                      {WINDOW_TYPE_MAP[r.window_type]?.label ?? r.window_type}
                    </td>
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <Input
                          type="number"
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRate(r.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="h-8 w-28"
                        />
                      ) : (
                        <span className="font-mono tabular-nums text-heading">{r.base_rate}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" onClick={() => saveRate(r.id)} disabled={isBusy}>
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Save
                          </Button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
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
                          onClick={() => {
                            setError(null)
                            setEditingId(r.id)
                            setDraft(String(r.base_rate))
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft/50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

/* ================================================================== *
 * Page composition
 * ================================================================== */

export function CatalogManager() {
  return (
    <div className="space-y-6">
      <ColoursTable />
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
        <strong className="font-semibold">Fallback pricing.</strong> These rates apply only to
        designs with no profile series selected. Designs with a series are priced by the
        weight-based BOM engine (Aluminium Coating &amp; Aluminium Setting).
      </div>
      <FallbackPricing />
    </div>
  )
}
