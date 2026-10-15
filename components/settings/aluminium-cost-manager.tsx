'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'

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

const OVERLAP_FIELDS: { key: keyof CostSettings; label: string }[] = [
  { key: 'slider_width_overlap', label: 'Slider width' },
  { key: 'slider_height_overlap', label: 'Slider height' },
  { key: 'slider_glass_overlap', label: 'Slider glass' },
  { key: 'slim_width_overlap', label: 'Slim width' },
  { key: 'casement_width_overlap', label: 'Casement width' },
  { key: 'casement_height_overlap', label: 'Casement height' },
  { key: 'casement_glass_overlap', label: 'Casement glass' },
]

/** Per-user aluminium cost heads + overlaps. Upserts a single row by user_id. */
export function AluminiumCostManager() {
  const supabase = createClient()
  const [values, setValues] = useState<CostSettings>(DEFAULTS)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const set = (key: keyof CostSettings, v: string) =>
    setValues((prev) => ({ ...prev, [key]: Number(v) || 0 }))

  const save = async () => {
    if (!userId) return
    setSaving(true)
    setSaved(false)
    setError(null)
    const { error: err } = await supabase
      .from('aluminium_cost_settings')
      .upsert({ user_id: userId, ...values, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setSaving(false)
    if (err) setError(err.message)
    else setSaved(true)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading cost settings...
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-heading">Aluminium cost settings</h3>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>

      {error && <p className="mb-3 rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">{error}</p>}

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Cost heads
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COST_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {f.label} <span className="text-muted-foreground/60">· {f.unit}</span>
            </Label>
            <Input
              type="number"
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className="h-9"
            />
          </div>
        ))}
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Overlaps (mm) — used for cut sizes
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {OVERLAP_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{f.label}</Label>
            <Input
              type="number"
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className="h-9"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
