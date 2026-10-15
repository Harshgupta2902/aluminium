'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'

/** Available stock-length options (feet), as in the original StockLength page. */
const LENGTH_OPTIONS = [
  '12 Feet',
  '13 Feet',
  '14 Feet',
  '15 Feet',
  '16 Feet',
  '17 Feet',
  '18 Feet',
  '19 Feet',
  '20 Feet',
] as const

/** Parse the comma-joined available_length string into a set of selected feet. */
function parseLengths(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    // normalise "16 Ft" (legacy seed) -> "16 Feet"
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

/**
 * Manage the profile Company + Series registry (`aluminium_series`) and, per
 * series, its series-scoped profiles (`series_profiles`) grouped by
 * profile_group. Mirrors the original "Aluminium Coating / StockLength" pages
 * plus the designer's profile catalog.
 */
export function SeriesManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<SeriesRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Add-series form
  const [newCompany, setNewCompany] = useState('Vitco')
  const [newSeries, setNewSeries] = useState('')
  const [newLength, setNewLength] = useState('')
  const [busy, setBusy] = useState(false)

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

  const addSeries = async () => {
    if (!newSeries.trim() || !newCompany.trim()) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.from('aluminium_series').insert([
      {
        company: newCompany.trim(),
        series_name: newSeries.trim(),
        available_length: newLength.trim() || null,
        material: 'aluminium',
        sort_order: rows.length + 1,
        created_by: userId,
      },
    ])
    if (err) setError(err.message)
    setNewSeries('')
    setNewLength('')
    await refresh()
    setBusy(false)
  }

  const patchSeries = async (id: string, p: Partial<SeriesRow>) => {
    const { error: err } = await supabase.from('aluminium_series').update(p).eq('id', id)
    if (err) setError(err.message)
    await refresh()
  }

  const removeSeries = async (id: string) => {
    // series_profiles cascade-delete via FK.
    const { error: err } = await supabase.from('aluminium_series').delete().eq('id', id)
    if (err) setError(err.message)
    if (expanded === id) setExpanded(null)
    await refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading series...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">{error}</p>
      )}

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold text-heading">Profile Series</h3>
          <span className="text-xs text-muted-foreground">{rows.length} series</span>
        </div>

        <div className="divide-y divide-border/60">
          {rows.map((s) => (
            <div key={s.id}>
              {/* Series row */}
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                  title="Show profiles"
                >
                  {expanded === s.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <Input
                  value={s.company}
                  onChange={(e) =>
                    setRows((prev) => prev.map((x) => (x.id === s.id ? { ...x, company: e.target.value } : x)))
                  }
                  onBlur={(e) => patchSeries(s.id, { company: e.target.value })}
                  className="h-8 w-28"
                  title="Company"
                />
                <Input
                  value={s.series_name}
                  onChange={(e) =>
                    setRows((prev) => prev.map((x) => (x.id === s.id ? { ...x, series_name: e.target.value } : x)))
                  }
                  onBlur={(e) => patchSeries(s.id, { series_name: e.target.value })}
                  className="h-8 flex-1"
                  title="Series name"
                />
                <LengthMultiSelect
                  value={s.available_length}
                  onChange={(joined) => {
                    setRows((prev) => prev.map((x) => (x.id === s.id ? { ...x, available_length: joined } : x)))
                    void patchSeries(s.id, { available_length: joined })
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeSeries(s.id)}
                  className="flex h-7 w-7 items-center justify-center rounded text-rose-600 hover:bg-rose-50"
                  title="Delete series"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Expanded profiles */}
              {expanded === s.id && (
                <div className="bg-muted/30 px-4 pb-3 pt-1">
                  <SeriesProfiles seriesId={s.id} userId={userId} onError={setError} />
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No series yet. Add one below.
            </p>
          )}
        </div>

        {/* Add series */}
        <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
          <Input value={newCompany} placeholder="Company" onChange={(e) => setNewCompany(e.target.value)} className="h-8 w-28" />
          <Input value={newSeries} placeholder="New series name…" onChange={(e) => setNewSeries(e.target.value)} className="h-8 flex-1" />
          <LengthMultiSelect value={newLength} onChange={setNewLength} />
          <Button size="sm" onClick={addSeries} disabled={busy || !newSeries.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Profiles for one series, grouped by profile_group. Lazy-loaded on expand. */
function SeriesProfiles({
  seriesId,
  userId,
  onError,
}: {
  seriesId: string
  userId: string | null
  onError: (msg: string | null) => void
}) {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('series_profiles')
      .select('*')
      .eq('series_id', seriesId)
      .order('profile_group', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) onError(error.message)
    setProfiles((data as ProfileRow[]) ?? [])
    setLoading(false)
  }, [supabase, seriesId, onError])

  useEffect(() => {
    let active = true
    void (async () => {
      const { data, error } = await supabase
        .from('series_profiles')
        .select('*')
        .eq('series_id', seriesId)
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
  }, [seriesId])

  const patch = async (id: string, p: Partial<ProfileRow>) => {
    const { error } = await supabase.from('series_profiles').update(p).eq('id', id)
    if (error) onError(error.message)
    await refresh()
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('series_profiles').delete().eq('id', id)
    if (error) onError(error.message)
    await refresh()
  }

  const addProfile = async (group: string) => {
    const { error } = await supabase.from('series_profiles').insert([
      {
        series_id: seriesId,
        profile_group: group,
        name: 'New',
        profile_code: '',
        sort_order: profiles.filter((p) => p.profile_group === group).length + 1,
        created_by: userId,
      },
    ])
    if (error) onError(error.message)
    await refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading profiles...
      </div>
    )
  }

  // Group rows by profile_group, keeping GROUP_LABELS order first.
  const groups = Array.from(new Set(profiles.map((p) => p.profile_group)))
  const ordered = [
    ...Object.keys(GROUP_LABELS).filter((g) => groups.includes(g)),
    ...groups.filter((g) => !(g in GROUP_LABELS)),
  ]

  if (profiles.length === 0) {
    return (
      <p className="py-3 text-xs text-muted-foreground">
        No profiles for this series.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {ordered.map((group) => {
        const items = profiles.filter((p) => p.profile_group === group)
        return (
          <div key={group} className="rounded-md border border-border/60 bg-card p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {GROUP_LABELS[group] ?? group}{' '}
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
                    onChange={(e) =>
                      setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, profile_code: e.target.value } : x)))
                    }
                    onBlur={(e) => patch(p.id, { profile_code: e.target.value })}
                    className="h-7 w-28 text-xs"
                  />
                  <Input
                    value={p.name}
                    onChange={(e) =>
                      setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))
                    }
                    onBlur={(e) => patch(p.id, { name: e.target.value })}
                    className="h-7 flex-1 text-xs"
                  />
                  <Input
                    type="number"
                    value={p.thickness ?? ''}
                    placeholder="mm"
                    title="Thickness (mm)"
                    onChange={(e) =>
                      setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, thickness: Number(e.target.value) } : x)))
                    }
                    onBlur={(e) => patch(p.id, { thickness: e.target.value === '' ? null : Number(e.target.value) })}
                    className="h-7 w-16 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Multi-select dropdown of stock lengths (12–20 Feet). Stores the selection as
 * a comma-joined string in `available_length`. Mirrors the original
 * StockLength page's checkbox list.
 */
function LengthMultiSelect({
  value,
  onChange,
}: {
  value: string | null
  onChange: (joined: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = parseLengths(value)

  // Close on outside click.
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
    // Keep in LENGTH_OPTIONS order.
    const joined = LENGTH_OPTIONS.filter((o) => set.has(o)).join(', ')
    onChange(joined)
  }

  const label =
    selected.length === 0
      ? 'Lengths'
      : selected.length <= 2
        ? selected.join(', ')
        : `${selected.length} selected`

  return (
    <div className="relative w-36" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-full items-center justify-between rounded-md border border-border bg-background px-2 text-xs text-foreground"
        title="Available lengths"
      >
        <span className={selected.length ? 'truncate' : 'text-muted-foreground'}>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card p-1 shadow-lg">
          {LENGTH_OPTIONS.map((opt) => {
            const checked = selected.includes(opt)
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  className="h-3.5 w-3.5 accent-[var(--color-primary)]"
                />
                {opt}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
