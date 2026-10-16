'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Pencil, Eye, X, ChevronDown } from 'lucide-react'

/** Available stock-length options (feet), as in the original StockLength page. */
const LENGTH_OPTIONS = [
  '12 Feet', '13 Feet', '14 Feet', '15 Feet', '16 Feet',
  '17 Feet', '18 Feet', '19 Feet', '20 Feet',
] as const

/** Parse the comma-joined available_length string into a list of selected feet. */
function parseLengths(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\bft\b/i, 'Feet').replace(/\s+/g, ' '))
}

interface SeriesRow {
  id: string
  company: string
  series_name: string
  available_length: string | null
  material: string
  is_active: boolean
  sort_order: number
}

interface ProfileRow {
  id: string
  series_id: string
  profile_group: string
  profile_code: string | null
  name: string
  thickness: number | null
  weight_per_meter: number | null
  is_active: boolean
  sort_order: number
}

/** Human labels for the profile_group codes. */
const GROUP_LABELS: Record<string, string> = {
  track: 'Tracks',
  sash: 'Sashes',
  mesh_sash: 'Mesh Sashes',
  interlock: 'Interlocks',
  clip: 'Clips',
  mesh_clip: 'Mesh Clips',
  mullion: 'Mullions',
  slim_interlock: 'Slim Interlocks',
  slim_huricane: 'Slim Hurricane',
  outer_top: 'Outer Top',
  outer_left: 'Outer Left',
}

const groupLabel = (g: string) => GROUP_LABELS[g] ?? g

/* ================================================================== *
 * Main manager — table of series with View / Edit / Add popups
 * ================================================================== */

type DialogMode = { kind: 'add' } | { kind: 'edit'; series: SeriesRow } | { kind: 'view'; series: SeriesRow } | null

export function SeriesManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<SeriesRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogMode>(null)

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('aluminium_series')
      .select('*')
      .order('sort_order', { ascending: true })
    if (err) setError(err.message)
    setRows((data as SeriesRow[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let active = true
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      setUserId(user?.id ?? null)
      await refresh()
    })()
    return () => {
      active = false
    }
  }, [supabase, refresh])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading series...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </p>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{rows.length} series</span>
        <Button onClick={() => setDialog({ kind: 'add' })}>
          <Plus className="h-4 w-4" />
          Add Series
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm [&_td]:border [&_td]:border-dashed [&_td]:border-border [&_th]:border [&_th]:border-dashed [&_th]:border-border">
            <colgroup>
              <col className="w-40" />
              <col />
              <col className="w-56" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Series</th>
                <th className="px-4 py-2.5">Available Length</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No series yet. Click “Add Series”.
                  </td>
                </tr>
              ) : (
                rows.map((s) => {
                  const lens = parseLengths(s.available_length)
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-2.5 text-muted-foreground">{s.company}</td>
                      <td className="px-4 py-2.5 font-medium text-heading">{s.series_name}</td>
                      <td className="px-4 py-2.5">
                        {lens.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {lens.map((l) => (
                              <span
                                key={l}
                                className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                              >
                                {l.replace(' Feet', 'ft')}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: 'view', series: s })}
                            title="View profiles"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-heading"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: 'edit', series: s })}
                            title="Edit"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft/50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dialog?.kind === 'add' && (
        <SeriesDialog
          mode="add"
          userId={userId}
          seriesCount={rows.length}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            void refresh()
          }}
          onError={setError}
        />
      )}
      {dialog?.kind === 'edit' && (
        <SeriesDialog
          mode="edit"
          userId={userId}
          series={dialog.series}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            void refresh()
          }}
          onError={setError}
        />
      )}
      {dialog?.kind === 'view' && (
        <ViewSeriesDialog series={dialog.series} onClose={() => setDialog(null)} onError={setError} />
      )}
    </div>
  )
}

/* ================================================================== *
 * Modal shell
 * ================================================================== */

function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[85vh] w-full flex-col rounded-xl border border-border bg-card shadow-lg ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-heading">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-heading"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border px-4 py-3">{footer}</div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== *
 * View dialog — read-only series details + profiles by group
 * ================================================================== */

function ViewSeriesDialog({
  series,
  onClose,
  onError,
}: {
  series: SeriesRow
  onClose: () => void
  onError: (m: string | null) => void
}) {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void (async () => {
      const { data, error } = await supabase
        .from('series_profiles')
        .select('*')
        .eq('series_id', series.id)
        .order('profile_group', { ascending: true })
        .order('sort_order', { ascending: true })
      if (!active) return
      if (error) onError(error.message)
      setProfiles((data as ProfileRow[]) ?? [])
      setLoading(false)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series.id])

  const lens = parseLengths(series.available_length)
  const groups = Array.from(new Set(profiles.map((p) => p.profile_group)))
  const ordered = [
    ...Object.keys(GROUP_LABELS).filter((g) => groups.includes(g)),
    ...groups.filter((g) => !(g in GROUP_LABELS)),
  ]

  return (
    <Modal
      title={`${series.company} · ${series.series_name}`}
      onClose={onClose}
      wide
      footer={
        <Button size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-muted-foreground">Available lengths:</span>
        {lens.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          lens.map((l) => (
            <span key={l} className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
              {l}
            </span>
          ))
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading profiles...
        </div>
      ) : profiles.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No profiles for this series.
        </p>
      ) : (
        <div className="space-y-4">
          {ordered.map((group) => {
            const items = profiles.filter((p) => p.profile_group === group)
            return (
              <div key={group}>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {groupLabel(group)} <span className="text-muted-foreground/60">({items.length})</span>
                </h4>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-1.5">Code</th>
                        <th className="px-3 py-1.5">Name</th>
                        <th className="px-3 py-1.5 text-right">Thk (mm)</th>
                        <th className="px-3 py-1.5 text-right">Wt (kg/m)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p) => (
                        <tr key={p.id} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                            {p.profile_code || '—'}
                          </td>
                          <td className="px-3 py-1.5 text-heading">{p.name}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{p.thickness ?? '—'}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            {p.weight_per_meter ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

/* ================================================================== *
 * Add / Edit dialog — series fields + (edit) its profiles
 * ================================================================== */

function SeriesDialog({
  mode,
  series,
  userId,
  seriesCount = 0,
  onClose,
  onSaved,
  onError,
}: {
  mode: 'add' | 'edit'
  series?: SeriesRow
  userId: string | null
  seriesCount?: number
  onClose: () => void
  onSaved: () => void
  onError: (m: string | null) => void
}) {
  const supabase = createClient()
  const [company, setCompany] = useState(series?.company ?? 'Vitco')
  const [seriesName, setSeriesName] = useState(series?.series_name ?? '')
  const [length, setLength] = useState(series?.available_length ?? '')
  const [saving, setSaving] = useState(false)

  // Profiles (edit mode only)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [profLoading, setProfLoading] = useState(mode === 'edit')

  useEffect(() => {
    if (mode !== 'edit' || !series) return
    let active = true
    void (async () => {
      const { data, error } = await supabase
        .from('series_profiles')
        .select('*')
        .eq('series_id', series.id)
        .order('profile_group', { ascending: true })
        .order('sort_order', { ascending: true })
      if (!active) return
      if (error) onError(error.message)
      setProfiles((data as ProfileRow[]) ?? [])
      setProfLoading(false)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveSeries = async () => {
    if (!seriesName.trim() || !company.trim()) {
      onError('Company and series name are required.')
      return
    }
    setSaving(true)
    onError(null)
    try {
      if (mode === 'add') {
        const { data: inserted, error } = await supabase
          .from('aluminium_series')
          .insert([
            {
              company: company.trim(),
              series_name: seriesName.trim(),
              available_length: length.trim() || null,
              material: 'aluminium',
              sort_order: seriesCount + 1,
              created_by: userId,
            },
          ])
          .select('id')
          .single()
        if (error) throw error
        void inserted
      } else if (series) {
        const { error } = await supabase
          .from('aluminium_series')
          .update({
            company: company.trim(),
            series_name: seriesName.trim(),
            available_length: length.trim() || null,
          })
          .eq('id', series.id)
        if (error) throw error
        // Persist profile edits.
        for (const p of profiles) {
          const { error: perr } = await supabase
            .from('series_profiles')
            .update({
              profile_code: p.profile_code,
              name: p.name,
              thickness: p.thickness,
              weight_per_meter: p.weight_per_meter,
            })
            .eq('id', p.id)
          if (perr) throw perr
        }
      }
      onSaved()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to save')
      setSaving(false)
    }
  }

  const patchProfile = (id: string, patch: Partial<ProfileRow>) =>
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const addProfile = async (group: string) => {
    if (!series) return
    const { data, error } = await supabase
      .from('series_profiles')
      .insert([
        {
          series_id: series.id,
          profile_group: group,
          name: 'New',
          profile_code: '',
          weight_per_meter: 0.6,
          sort_order: profiles.filter((p) => p.profile_group === group).length + 1,
          created_by: userId,
        },
      ])
      .select('*')
      .single()
    if (error) {
      onError(error.message)
      return
    }
    setProfiles((prev) => [...prev, data as ProfileRow])
  }

  const groups = Array.from(new Set(profiles.map((p) => p.profile_group)))
  const ordered = [
    ...Object.keys(GROUP_LABELS).filter((g) => groups.includes(g)),
    ...groups.filter((g) => !(g in GROUP_LABELS)),
  ]

  return (
    <Modal
      title={mode === 'add' ? 'Add Series' : `Edit · ${series?.series_name ?? ''}`}
      onClose={onClose}
      wide={mode === 'edit'}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={saveSeries} disabled={saving || !seriesName.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'add' ? 'Add Series' : 'Save Changes'}
          </Button>
        </>
      }
    >
      {/* Series fields */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Company *</label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Series name *</label>
          <Input
            autoFocus
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            placeholder="e.g. 27mm window series"
            className="h-9"
          />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Available lengths</label>
        <LengthMultiSelect value={length} onChange={setLength} full />
      </div>

      {/* Profiles (edit only) */}
      {mode === 'edit' && (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-semibold text-heading">Profiles</h3>
          {profLoading ? (
            <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading profiles...
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-3 text-xs text-muted-foreground">No profiles for this series.</p>
          ) : (
            <div className="space-y-3">
              {ordered.map((group) => {
                const items = profiles.filter((p) => p.profile_group === group)
                return (
                  <div key={group} className="rounded-lg border border-border/60 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {groupLabel(group)}{' '}
                        <span className="text-muted-foreground/60">({items.length})</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => addProfile(group)}
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-primary hover:bg-primary-soft/40"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {items.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <Input
                            value={p.profile_code ?? ''}
                            placeholder="Code"
                            onChange={(e) => patchProfile(p.id, { profile_code: e.target.value })}
                            className="h-7 w-28 text-xs"
                          />
                          <Input
                            value={p.name}
                            onChange={(e) => patchProfile(p.id, { name: e.target.value })}
                            className="h-7 flex-1 text-xs"
                          />
                          <Input
                            type="number"
                            value={p.thickness ?? ''}
                            placeholder="mm"
                            title="Thickness (mm)"
                            onChange={(e) =>
                              patchProfile(p.id, {
                                thickness: e.target.value === '' ? null : Number(e.target.value),
                              })
                            }
                            className="h-7 w-16 text-xs"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={p.weight_per_meter ?? ''}
                            placeholder="kg/m"
                            title="Weight per metre (kg/m)"
                            onChange={(e) =>
                              patchProfile(p.id, {
                                weight_per_meter: e.target.value === '' ? 0 : Number(e.target.value),
                              })
                            }
                            className="h-7 w-16 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Profile changes save when you click “Save Changes”.
          </p>
        </div>
      )}
    </Modal>
  )
}

/* ================================================================== *
 * Length multi-select (12–20 Feet)
 * ================================================================== */

function LengthMultiSelect({
  value,
  onChange,
  full,
}: {
  value: string | null
  onChange: (joined: string) => void
  full?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = parseLengths(value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (opt: string) => {
    const set = new Set(selected)
    if (set.has(opt)) set.delete(opt)
    else set.add(opt)
    onChange(LENGTH_OPTIONS.filter((o) => set.has(o)).join(', '))
  }

  const label =
    selected.length === 0
      ? 'Select lengths'
      : selected.length <= 3
        ? selected.join(', ')
        : `${selected.length} selected`

  return (
    <div className={`relative ${full ? 'w-full' : 'w-36'}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-2.5 text-sm text-foreground"
      >
        <span className={selected.length ? 'truncate' : 'text-muted-foreground'}>{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 grid w-full grid-cols-3 gap-0.5 rounded-md border border-border bg-card p-1.5 shadow-lg">
          {LENGTH_OPTIONS.map((opt) => {
            const checked = selected.includes(opt)
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 text-xs hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  className="h-3.5 w-3.5 accent-[var(--color-primary)]"
                />
                {opt.replace(' Feet', 'ft')}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
