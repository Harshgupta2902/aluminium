'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save } from 'lucide-react'
import { WINDOW_TYPE_MAP } from '@/lib/design-editor/frame-model'

interface RateRow {
  id: string
  window_type: string
  base_rate: number
  sort_order: number
}

/** Manage per-type base rates + global GST / install percentages. */
export function PricingManager() {
  const supabase = createClient()
  const [rates, setRates] = useState<RateRow[]>([])
  const [gst, setGst] = useState('18')
  const [install, setInstall] = useState('10')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      const [rateRes, cfgRes] = await Promise.all([
        supabase.from('design_type_rates').select('*').order('sort_order'),
        supabase.from('design_pricing_config').select('*').eq('id', 1).maybeSingle(),
      ])
      if (!active) return
      setRates((rateRes.data as RateRow[]) ?? [])
      if (cfgRes.data) {
        setGst(String(cfgRes.data.gst_percentage))
        setInstall(String(cfgRes.data.install_percentage))
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [supabase])

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      // Upsert each rate + the single config row.
      for (const r of rates) {
        const { error: e } = await supabase
          .from('design_type_rates')
          .update({ base_rate: r.base_rate })
          .eq('id', r.id)
        if (e) throw e
      }
      const { error: ce } = await supabase
        .from('design_pricing_config')
        .update({ gst_percentage: Number(gst), install_percentage: Number(install) })
        .eq('id', 1)
      if (ce) throw ce
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading pricing...
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-heading">Pricing</h3>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>

      {error && <p className="mb-2 rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">{error}</p>}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">GST %</label>
          <Input type="number" value={gst} onChange={(e) => setGst(e.target.value)} className="h-8" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Install %</label>
          <Input type="number" value={install} onChange={(e) => setInstall(e.target.value)} className="h-8" />
        </div>
      </div>

      <p className="mb-2 text-xs font-medium text-muted-foreground">Base rate per window type (₹)</p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {rates.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <span className="flex-1 truncate text-sm text-foreground">
              {WINDOW_TYPE_MAP[r.window_type]?.label ?? r.window_type}
            </span>
            <Input
              type="number"
              value={r.base_rate}
              onChange={(e) =>
                setRates((prev) =>
                  prev.map((x) => (x.id === r.id ? { ...x, base_rate: Number(e.target.value) } : x))
                )
              }
              className="h-8 w-24"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
