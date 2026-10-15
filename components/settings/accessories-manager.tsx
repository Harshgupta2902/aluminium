'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Trash2, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const CARD_PAGE_SIZE = 20

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

export const ACCESSORY_KINDS: { kind: AccessoryKind; label: string; group: string }[] = [
  { kind: 'sash', label: 'Sash', group: 'Core' },
  { kind: 'interlock', label: 'Interlock', group: 'Core' },
  { kind: 'handle', label: 'Handle', group: 'Core' },
  { kind: 'roller', label: 'Roller', group: 'Core' },
  { kind: 'lock', label: 'Lock', group: 'Core' },
  { kind: 'hinge', label: 'Hinge', group: 'Core' },
  { kind: 'mesh', label: 'Mesh', group: 'Core' },
  { kind: 'slim_interlock', label: 'Slim Interlock', group: 'Slim profile' },
  { kind: 'reinforcement', label: 'Reinforcement', group: 'Slim profile' },
  { kind: 'friction_stay', label: 'Friction Stay / Hinges', group: 'Casement' },
  { kind: 'mesh_type', label: 'Mesh Type', group: 'Mesh' },
  { kind: 'mesh_sash', label: 'Mesh Sash', group: 'Mesh' },
  { kind: 'mesh_clip', label: 'Mesh Clip', group: 'Mesh' },
  { kind: 'mesh_handle', label: 'Mesh Handle', group: 'Mesh' },
  { kind: 'mesh_slim', label: 'Mesh Slim', group: 'Mesh' },
  { kind: 'common', label: 'Common / Consumables', group: 'Common' },
]

const GROUP_ORDER = ['Core', 'Slim profile', 'Casement', 'Mesh', 'Common'] as const

interface AccessoryRow {
  id: string
  kind: AccessoryKind
  name: string
  code: string | null
  price: number
  is_active: boolean
  is_default: boolean
  sort_order: number
}

/**
 * Manage the user's typed accessories (sash/interlock/handle/roller/lock/
 * hinge/mesh). Grouped by kind; add / rename / set price+code / default /
 * delete. Writes set created_by so per-user RLS is satisfied.
 */
export function AccessoriesManager() {
  const supabase = createClient()
  const [rows, setRows] = useState<AccessoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      setUserId(user?.id ?? null)
      const { data, error: err } = await supabase
        .from('design_accessories')
        .select('*')
        .order('kind', { ascending: true })
        .order('sort_order', { ascending: true })
      if (!active) return
      if (err) setError(err.message)
      setRows((data as AccessoryRow[]) ?? [])
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [supabase])

  const refresh = async () => {
    const { data } = await supabase
      .from('design_accessories')
      .select('*')
      .order('kind', { ascending: true })
      .order('sort_order', { ascending: true })
    setRows((data as AccessoryRow[]) ?? [])
  }

  const byKind = useMemo(() => {
    const map = new Map<AccessoryKind, AccessoryRow[]>()
    for (const { kind } of ACCESSORY_KINDS) map.set(kind, [])
    for (const r of rows) map.get(r.kind)?.push(r)
    return map
  }, [rows])

  const patch = async (id: string, p: Partial<AccessoryRow>) => {
    const { error: err } = await supabase.from('design_accessories').update(p).eq('id', id)
    if (err) setError(err.message)
    await refresh()
  }

  const remove = async (id: string) => {
    const { error: err } = await supabase.from('design_accessories').delete().eq('id', id)
    if (err) setError(err.message)
    await refresh()
  }

  const add = async (kind: AccessoryKind, name: string, code: string, price: string) => {
    if (!name.trim()) return
    setError(null)
    const { error: err } = await supabase.from('design_accessories').insert([
      {
        kind,
        name: name.trim(),
        code: code.trim() || null,
        price: Number(price) || 0,
        sort_order: (byKind.get(kind)?.length ?? 0) + 1,
        created_by: userId,
      },
    ])
    if (err) setError(err.message)
    await refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading accessories...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </div>
      )}
      {GROUP_ORDER.map((group) => {
        const kinds = ACCESSORY_KINDS.filter((k) => k.group === group)
        if (kinds.length === 0) return null
        return (
          <div key={group} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group}
            </h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {kinds.map(({ kind, label }) => (
                <KindCard
                  key={kind}
                  label={label}
                  rows={byKind.get(kind) ?? []}
                  onAdd={(name, code, price) => add(kind, name, code, price)}
                  onPatch={patch}
                  onRemove={remove}
                  onLocalChange={setRows}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KindCard({
  label,
  rows,
  onAdd,
  onPatch,
  onRemove,
  onLocalChange,
}: {
  label: string
  rows: AccessoryRow[]
  onAdd: (name: string, code: string, price: string) => void
  onPatch: (id: string, p: Partial<AccessoryRow>) => void
  onRemove: (id: string) => void
  onLocalChange: React.Dispatch<React.SetStateAction<AccessoryRow[]>>
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [price, setPrice] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const submit = () => {
    onAdd(name, code, price)
    setName('')
    setCode('')
    setPrice('')
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.code ?? '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / CARD_PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(current * CARD_PAGE_SIZE, current * CARD_PAGE_SIZE + CARD_PAGE_SIZE)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-heading">{label}</h3>
        <span className="text-xs text-muted-foreground">{rows.length}</span>
      </div>

      {rows.length > CARD_PAGE_SIZE && (
        <Input
          value={search}
          placeholder="Search…"
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="mb-2 h-8"
        />
      )}

      <div className="space-y-1.5">
        {pageRows.length === 0 && (
          <p className="py-2 text-xs text-muted-foreground">No {label.toLowerCase()} options yet.</p>
        )}
        {pageRows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5">
            <Input
              value={r.name}
              onChange={(e) =>
                onLocalChange((prev) => prev.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))
              }
              onBlur={(e) => onPatch(r.id, { name: e.target.value })}
              className="h-8 flex-1"
            />
            <Input
              value={r.code ?? ''}
              placeholder="Code"
              onChange={(e) =>
                onLocalChange((prev) => prev.map((x) => (x.id === r.id ? { ...x, code: e.target.value } : x)))
              }
              onBlur={(e) => onPatch(r.id, { code: e.target.value })}
              className="h-8 w-20"
            />
            <Input
              type="number"
              value={r.price}
              title="Price (₹)"
              onChange={(e) =>
                onLocalChange((prev) => prev.map((x) => (x.id === r.id ? { ...x, price: Number(e.target.value) } : x)))
              }
              onBlur={(e) => onPatch(r.id, { price: Number(e.target.value) })}
              className="h-8 w-20"
            />
            <button
              type="button"
              title={r.is_default ? 'Default' : 'Set default'}
              onClick={() => onPatch(r.id, { is_default: !r.is_default })}
              className={`flex h-7 shrink-0 items-center gap-1 rounded px-2 text-xs ${
                r.is_default ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(r.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {current * CARD_PAGE_SIZE + 1}–{Math.min((current + 1) * CARD_PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1">{current + 1} / {pageCount}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={current >= pageCount - 1}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
        <Input value={name} placeholder={`Add ${label.toLowerCase()}…`} onChange={(e) => setName(e.target.value)} className="h-8 flex-1" />
        <Input value={code} placeholder="Code" onChange={(e) => setCode(e.target.value)} className="h-8 w-20" />
        <Input type="number" value={price} placeholder="₹" onChange={(e) => setPrice(e.target.value)} className="h-8 w-20" />
        <Button size="sm" onClick={submit} disabled={!name.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {rows.some((r) => r.price > 0) && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          e.g. {rows.find((r) => r.price > 0)!.name}: {formatCurrency(rows.find((r) => r.price > 0)!.price)}
        </p>
      )}
    </div>
  )
}
