'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Check, X, Pencil } from 'lucide-react'

interface CostSettings {
  aluminium_rate: number
  profit_percentage: number
  labour_charge: number
  coating: number
  corner_cleat: number
  weather_strip: number
  ss_corner_con: number
  screw: number
  rail: number
  fastner: number
  dustpad: number
  outer_clit: number
  sash_clit: number
  l_pati: number
  lockguide_cap: number
  interlock_cap: number
  bubstopper: number
  ugid: number
  lockguid: number
  water_drainage: number
  brassrubber: number
  suitbelt: number
  slider_width_overlap: number
  slider_height_overlap: number
  slider_glass_overlap: number
  casement_width_overlap: number
  casement_height_overlap: number
  casement_glass_overlap: number
  slim_width_overlap: number
}

const DEFAULTS: CostSettings = {
  aluminium_rate: 0,
  profit_percentage: 0,
  labour_charge: 0,
  coating: 0,
  corner_cleat: 0,
  weather_strip: 0,
  ss_corner_con: 0,
  screw: 0,
  rail: 0,
  fastner: 0,
  dustpad: 0,
  outer_clit: 0,
  sash_clit: 0,
  l_pati: 0,
  lockguide_cap: 0,
  interlock_cap: 0,
  bubstopper: 0,
  ugid: 0,
  lockguid: 0,
  water_drainage: 0,
  brassrubber: 0,
  suitbelt: 0,
  slider_width_overlap: 25,
  slider_height_overlap: 18,
  slider_glass_overlap: 16,
  casement_width_overlap: 12,
  casement_height_overlap: 12,
  casement_glass_overlap: 20,
  slim_width_overlap: 25,
}

const COST_FIELDS: { key: keyof CostSettings; label: string; unit: string }[] = [
  { key: 'aluminium_rate', label: 'Aluminium', unit: 'Rs / Kg' },
  { key: 'profit_percentage', label: 'Profit Percentage', unit: '%' },
  { key: 'labour_charge', label: 'Labour Charge', unit: 'Rs / Sqft' },
  { key: 'coating', label: 'Coating', unit: 'Rs / Kg' },
  { key: 'corner_cleat', label: 'Corner Cleat', unit: 'Rs / Qty' },
  { key: 'weather_strip', label: 'Weather Strip', unit: 'Rs / Meter' },
  { key: 'ss_corner_con', label: 'SS Corner Con', unit: 'Rs / Piece' },
  { key: 'screw', label: 'Screw', unit: 'Rs / Piece' },
  { key: 'rail', label: 'Rail', unit: 'Rs / Meter' },
  { key: 'fastner', label: 'Fastener', unit: 'Rs / Piece' },
  { key: 'dustpad', label: 'Dustpad', unit: 'Rs / Meter' },
  { key: 'outer_clit', label: 'Outer Clit', unit: 'Rs / Piece' },
  { key: 'sash_clit', label: 'Shutter Clit', unit: 'Rs / Piece' },
  { key: 'l_pati', label: 'L Pati', unit: 'Rs / Piece' },
  { key: 'lockguide_cap', label: 'Lockguide Cap', unit: 'Rs / Piece' },
  { key: 'interlock_cap', label: 'Interlock Cap', unit: 'Rs / Piece' },
  { key: 'bubstopper', label: 'Bub Stopper', unit: 'Rs / Piece' },
  { key: 'ugid', label: 'Ugid', unit: 'Rs / Piece' },
  { key: 'lockguid', label: 'Lockguid', unit: 'Rs / Piece' },
  { key: 'water_drainage', label: 'Water Drainage', unit: 'Rs / Piece' },
  { key: 'brassrubber', label: 'Brush Rubber', unit: 'Rs / Meter' },
  { key: 'suitbelt', label: 'Suit Bolt', unit: 'Rs / Piece' },
]

const OVERLAP_FIELDS: { key: keyof CostSettings; label: string; unit: string }[] = [
  { key: 'slider_width_overlap', label: 'Slider width', unit: 'mm' },
  { key: 'slider_height_overlap', label: 'Slider height', unit: 'mm' },
  { key: 'slider_glass_overlap', label: 'Slider glass', unit: 'mm' },
  { key: 'slim_width_overlap', label: 'Slim width', unit: 'mm' },
  { key: 'casement_width_overlap', label: 'Casement width', unit: 'mm' },
  { key: 'casement_height_overlap', label: 'Casement height', unit: 'mm' },
  { key: 'casement_glass_overlap', label: 'Casement glass', unit: 'mm' },
]

/** Per-user aluminium cost heads + overlaps. Upserts a single row by user_id. */
export function AluminiumCostManager() {
  const supabase = createClient()
  const [values, setValues] = useState<CostSettings>(DEFAULTS)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** The field currently being edited (one row at a time), + its draft value. */
  const [editingKey, setEditingKey] = useState<keyof CostSettings | null>(null)
  const [draft, setDraft] = useState('')
  const [savingKey, setSavingKey] = useState<keyof CostSettings | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      setUserId(user?.id ?? null)
      if (user) {
        const { data } = await supabase
          .from('aluminium_cost_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        if (active && data) {
          setValues({ ...DEFAULTS, ...(data as Partial<CostSettings>) })
        }
      }
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [supabase])

  const startEdit = (key: keyof CostSettings) => {
    setError(null)
    setEditingKey(key)
    setDraft(String(values[key] ?? 0))
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setDraft('')
  }

  /** Persist a single field (upsert the row with the one changed value). */
  const saveField = async (key: keyof CostSettings) => {
    if (!userId) return
    const next = Number(draft) || 0
    setSavingKey(key)
    setError(null)
    const { error: err } = await supabase
      .from('aluminium_cost_settings')
      .upsert(
        { user_id: userId, ...values, [key]: next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    setSavingKey(null)
    if (err) {
      setError(err.message)
      return
    }
    setValues((prev) => ({ ...prev, [key]: next }))
    setEditingKey(null)
    setDraft('')
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading cost settings...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </p>
      )}

      <CostTable
        title="Cost heads"
        fields={COST_FIELDS}
        values={values}
        editingKey={editingKey}
        draft={draft}
        savingKey={savingKey}
        onEdit={startEdit}
        onDraft={setDraft}
        onSave={saveField}
        onCancel={cancelEdit}
      />

      <CostTable
        title="Overlaps — used for cut sizes"
        fields={OVERLAP_FIELDS}
        values={values}
        editingKey={editingKey}
        draft={draft}
        savingKey={savingKey}
        onEdit={startEdit}
        onDraft={setDraft}
        onSave={saveField}
        onCancel={cancelEdit}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Read-only table with per-row inline editing
 * ------------------------------------------------------------------ */

interface FieldDef {
  key: keyof CostSettings
  label: string
  unit: string
}

function CostTable({
  title,
  fields,
  values,
  editingKey,
  draft,
  savingKey,
  onEdit,
  onDraft,
  onSave,
  onCancel,
}: {
  title: string
  fields: FieldDef[]
  values: CostSettings
  editingKey: keyof CostSettings | null
  draft: string
  savingKey: keyof CostSettings | null
  onEdit: (key: keyof CostSettings) => void
  onDraft: (v: string) => void
  onSave: (key: keyof CostSettings) => void
  onCancel: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/40 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-heading">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-sm [&_td]:border [&_td]:border-dashed [&_td]:border-border [&_th]:border [&_th]:border-dashed [&_th]:border-border">
          <colgroup>
            <col className="w-12" />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-22" />
            <col className="w-28" />
          </colgroup>
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5">S.N</th>
              <th className="px-4 py-2.5">Cost Head</th>
              <th className="px-4 py-2.5">Price / Value</th>
              <th className="px-4 py-2.5">Unit</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => {
              const isEditing = editingKey === f.key
              const isSaving = savingKey === f.key
              return (
                <tr key={f.key} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-heading">{f.label}</td>
                  <td className="px-4 py-2.5">
                    {isEditing ? (
                      <Input
                        type="number"
                        autoFocus
                        value={draft}
                        onChange={(e) => onDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onSave(f.key)
                          if (e.key === 'Escape') onCancel()
                        }}
                        className="h-8 w-32"
                      />
                    ) : (
                      <span className="tabular-nums text-heading">{values[f.key]}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{f.unit}</td>
                  <td className="px-4 py-2.5 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" onClick={() => onSave(f.key)} disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Save
                        </Button>
                        <button
                          type="button"
                          onClick={onCancel}
                          disabled={isSaving}
                          className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-heading disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEdit(f.key)}
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
  )
}
