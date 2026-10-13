'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Trash2, Check } from 'lucide-react'

interface ListRow {
  id: string
  name: string
  profile_code?: string | null
  rate_per_sqft?: number | null
  hex?: string | null
  is_active: boolean
  is_default: boolean
  sort_order: number
}

type Column = 'profile_code' | 'rate_per_sqft' | 'hex'

/**
 * Generic CRUD manager for a configurable list table (glasses, colors, GI
 * hardware). Add / edit name + optional extra column, toggle active/default,
 * and delete.
 */
export function ListManager({
  table,
  title,
  extraColumn,
  extraLabel,
}: {
  table: string
  title: string
  extraColumn?: Column
  extraLabel?: string
}) {
  const supabase = createClient()
  const [rows, setRows] = useState<ListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newExtra, setNewExtra] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    const { data, error: err } = await supabase
      .from(table)
      .select('*')
      .order('sort_order', { ascending: true })
    if (err) setError(err.message)
    setRows((data as ListRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    void (async () => {
      const { data, error: err } = await supabase
        .from(table)
        .select('*')
        .order('sort_order', { ascending: true })
      if (!active) return
      if (err) setError(err.message)
      setRows((data as ListRow[]) ?? [])
      setLoading(false)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  const add = async () => {
    if (!newName.trim()) return
    setBusy(true)
    setError(null)
    const payload: Record<string, unknown> = {
      name: newName.trim(),
      sort_order: rows.length + 1,
    }
    if (extraColumn && newExtra.trim()) {
      payload[extraColumn] =
        extraColumn === 'rate_per_sqft' ? Number(newExtra) : newExtra.trim()
    }
    const { error: err } = await supabase.from(table).insert([payload])
    if (err) setError(err.message)
    setNewName('')
    setNewExtra('')
    await refresh()
    setBusy(false)
  }

  const patch = async (id: string, p: Partial<ListRow>) => {
    const { error: err } = await supabase.from(table).update(p).eq('id', id)
    if (err) setError(err.message)
    await refresh()
  }

  const remove = async (id: string) => {
    const { error: err } = await supabase.from(table).delete().eq('id', id)
    if (err) setError(err.message)
    await refresh()
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-heading">{title}</h3>
        <span className="text-xs text-muted-foreground">{rows.length} items</span>
      </div>

      {error && (
        <p className="mb-2 rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5">
              <Input
                value={r.name}
                onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))}
                onBlur={(e) => patch(r.id, { name: e.target.value })}
                className="h-8 flex-1"
              />
              {extraColumn && (
                <Input
                  value={(r[extraColumn] as string | number | null) ?? ''}
                  placeholder={extraLabel}
                  onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, [extraColumn]: e.target.value } : x)))}
                  onBlur={(e) => patch(r.id, { [extraColumn]: extraColumn === 'rate_per_sqft' ? Number(e.target.value) : e.target.value })}
                  className="h-8 w-28"
                />
              )}
              <button
                type="button"
                title="Default"
                onClick={() => patch(r.id, { is_default: !r.is_default })}
                className={`flex h-7 items-center gap-1 rounded px-2 text-xs ${r.is_default ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}
              >
                <Check className="h-3 w-3" /> Default
              </button>
              <button
                type="button"
                title="Active"
                onClick={() => patch(r.id, { is_active: !r.is_active })}
                className={`h-7 rounded px-2 text-xs ${r.is_active ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}
              >
                {r.is_active ? 'Active' : 'Hidden'}
              </button>
              <button
                type="button"
                onClick={() => remove(r.id)}
                className="flex h-7 w-7 items-center justify-center rounded text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
        <Input value={newName} placeholder="Add new…" onChange={(e) => setNewName(e.target.value)} className="h-8 flex-1" />
        {extraColumn && (
          <Input value={newExtra} placeholder={extraLabel} onChange={(e) => setNewExtra(e.target.value)} className="h-8 w-28" />
        )}
        <Button size="sm" onClick={add} disabled={busy || !newName.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  )
}
