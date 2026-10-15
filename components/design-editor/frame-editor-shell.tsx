'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'
import { useFrameStore } from '@/store/frame-editor'
import { type FrameDocument } from '@/lib/design-editor/frame-model'
import { framePersistedPricing, DEFAULT_PRICING, type PricingConfig } from '@/lib/design-editor/frame-pricing'
import {
  framePersistedBom,
  resolveBomInputs,
  type CostSettings,
  DEFAULT_COST_SETTINGS,
} from '@/lib/design-editor/bom-pricing'
import { FrameToolRail } from './frame-tool-rail'
import { FrameCanvas } from './frame-canvas'
import { FrameToolbar } from './frame-toolbar'
import { FrameDetailsPanel, type EditorLists } from './frame-details-panel'

const FALLBACK_LISTS: EditorLists = {
  glasses: [
    { name: '4MM CLEAR GLASS', rate: 75 },
    { name: '5MM CLEAR GLASS', rate: 90 },
    { name: '5MM CLEAR TOUGHENED GLASS', rate: 90 },
    { name: '6MM TINTED GLASS', rate: 180 },
    { name: '6MM TOUGHENED GLASS', rate: 110 },
    { name: '8MM TOUGHENED GLASS', rate: 150 },
    { name: 'DOUBLE GLAZED UNIT', rate: 500 },
  ],
  colors: [
    { name: 'White' }, { name: 'Black' }, { name: 'Grey' }, { name: 'Brown' },
    { name: 'Bronze' }, { name: 'Wood Finish' }, { name: 'Anodized' },
  ],
  series: [],
  tracks: [{ name: '2 Track' }, { name: '3 Track' }, { name: 'Slim Track' }],
  sashes: [{ name: 'Standard Sash' }, { name: 'Slim Sash' }],
  interlocks: [{ name: 'Standard Interlock' }, { name: 'Slim Interlock' }],
  locks: [{ name: 'SLD TOUCH LOCK LEFT' }, { name: 'SLD TOUCH LOCK RIGHT' }, { name: 'Mortise Lock' }],
  accessories: [],
  pricing: DEFAULT_PRICING,
}

export function FrameEditorShell({
  initialDocument,
  quotationId = null,
}: {
  initialDocument: FrameDocument
  quotationId?: string | null
}) {
  const router = useRouter()
  const supabase = createClient()

  const load = useFrameStore((s) => s.load)
  const doc = useFrameStore((s) => s.doc)
  const message = useFrameStore((s) => s.message)
  const details = doc.details

  const [lists, setLists] = useState<EditorLists>(FALLBACK_LISTS)
  const [costSettings, setCostSettings] = useState<Partial<CostSettings>>(DEFAULT_COST_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hydrate the store once.
  useEffect(() => {
    load(initialDocument)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load configurable lists from Supabase (fall back to defaults on error).
  useEffect(() => {
    let active = true
    async function fetchLists() {
      try {
        const [glasses, colors, tracks, sashes, interlocks, locks, rates, cfg, accessories, seriesRows, profileRows] =
          await Promise.all([
            supabase.from('design_glasses').select('name, rate_per_sqft').eq('is_active', true).order('sort_order'),
            supabase.from('design_colors').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('gi_tracks').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('gi_sashes').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('gi_interlocks').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('gi_locks').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('design_type_rates').select('window_type, base_rate'),
            supabase.from('design_pricing_config').select('*').eq('id', 1).maybeSingle(),
            supabase
              .from('design_accessories')
              .select('id, kind, name, price')
              .eq('is_active', true)
              .order('sort_order'),
            supabase
              .from('aluminium_series')
              .select('id, company, series_name')
              .eq('is_active', true)
              .order('sort_order'),
            supabase
              .from('series_profiles')
              .select('series_id, profile_group, profile_code, name, weight_per_meter')
              .eq('is_active', true)
              .order('sort_order'),
          ])
        if (!active) return

        // Per-user aluminium cost settings for the BOM engine (own row).
        const { data: costRow } = await supabase
          .from('aluminium_cost_settings')
          .select('*')
          .maybeSingle()
        if (active && costRow) setCostSettings(costRow as Partial<CostSettings>)

        // If the tables aren't there yet, keep fallbacks.
        if (!glasses.data) return

        const typeRates: Record<string, number> = { ...DEFAULT_PRICING.typeRates }
        for (const r of rates.data ?? []) typeRates[r.window_type] = Number(r.base_rate)
        const pricing: PricingConfig = {
          typeRates,
          gstPercentage: Number(cfg.data?.gst_percentage ?? DEFAULT_PRICING.gstPercentage),
          installPercentage: Number(cfg.data?.install_percentage ?? DEFAULT_PRICING.installPercentage),
        }

        // Group series_profiles under their series.
        const profilesBySeries = new Map<string, EditorLists['series'][number]['profiles']>()
        for (const p of profileRows.data ?? []) {
          const list = profilesBySeries.get(p.series_id) ?? []
          list.push({
            profile_group: p.profile_group,
            profile_code: p.profile_code,
            name: p.name,
            weight_per_meter: Number(p.weight_per_meter) || 0,
          })
          profilesBySeries.set(p.series_id, list)
        }
        const series: EditorLists['series'] = (seriesRows.data ?? []).map((s) => ({
          id: s.id,
          company: s.company,
          series_name: s.series_name,
          profiles: profilesBySeries.get(s.id) ?? [],
        }))

        setLists({
          glasses: glasses.data?.length
            ? glasses.data.map((g) => ({ name: g.name, rate: Number(g.rate_per_sqft) || 0 }))
            : FALLBACK_LISTS.glasses,
          colors: colors.data?.length ? colors.data : FALLBACK_LISTS.colors,
          series,
          tracks: tracks.data?.length ? tracks.data : FALLBACK_LISTS.tracks,
          sashes: sashes.data?.length ? sashes.data : FALLBACK_LISTS.sashes,
          interlocks: interlocks.data?.length ? interlocks.data : FALLBACK_LISTS.interlocks,
          locks: locks.data?.length ? locks.data : FALLBACK_LISTS.locks,
          accessories: (accessories.data as EditorLists['accessories']) ?? [],
          pricing,
        })
      } catch {
        /* keep fallbacks */
      }
    }
    fetchLists()
    return () => {
      active = false
    }
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const current = useFrameStore.getState().doc
      if (!current.details.designRef.trim()) {
        setError('Please enter a Design Ref.')
        return
      }
      if (!current.details.glassType) {
        setError('Please select a Glass Type.')
        return
      }
      const hasWindow = current.sections.some((s) => s.window)
      if (!hasWindow) {
        setError('Add at least one window to a section before saving.')
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to save.')
        return
      }

      const first = current.sections.find((s) => s.window)!.window!

      // Use the weight-based BOM engine when a series is selected (its profiles
      // give real weights); otherwise fall back to the area × type-rate engine.
      const useBom = Boolean(current.details.seriesId)
      let areaSqft: number
      let ratePerSqft: number
      let amount: number
      let breakdown: unknown = null
      if (useBom) {
        const bomInputs = resolveBomInputs({
          cost: costSettings,
          series: lists.series,
          seriesId: current.details.seriesId,
          glasses: lists.glasses,
          glassType: current.details.glassType,
        })
        const p = framePersistedBom(current, bomInputs)
        areaSqft = p.areaSqft
        ratePerSqft = p.ratePerSqft
        amount = p.amount
        breakdown = p.breakdown
      } else {
        const p = framePersistedPricing(current, lists.pricing)
        areaSqft = p.areaSqft
        ratePerSqft = p.ratePerSqft
        amount = p.amount
      }

      const row = {
        name: current.details.designName || current.details.designRef || 'Untitled',
        window_type: first.type,
        width: current.width,
        height: current.height,
        profile_type: current.details.material ?? 'aluminium',
        glass_type: current.details.glassType || 'clear',
        glass_thickness: 5,
        color: current.details.colour,
        editor_document: current,
        panel_details: breakdown,
        area_sqft: areaSqft,
        rate_per_sqft: ratePerSqft,
        amount,
        created_by: user.id,
      }

      if (current.id) {
        const { error: updateError } = await supabase
          .from('window_designs')
          .update(row)
          .eq('id', current.id)
        if (updateError) throw updateError
        if (quotationId) {
          router.push(`/dashboard/quotations/new?edit=${quotationId}`)
          return
        }
      } else {
        const { data, error: insertError } = await supabase
          .from('window_designs')
          .insert([{ ...row, quotation_id: quotationId }])
          .select('id')
          .single()
        if (insertError) throw insertError
        if (quotationId) {
          router.push(`/dashboard/quotations/new?edit=${quotationId}`)
          return
        }
        if (data?.id) router.replace(`/design/${data.id}`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save design')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      {/* Top app bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 text-lg font-bold text-white shadow-sm">
            S
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-900">
              {details.designName || details.designRef || 'Untitled design'}
            </div>
            <div className="text-xs text-gray-400">Window designer</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="rounded-md bg-red-50 px-2.5 py-1 text-sm text-red-600">{error}</span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Workspace: slim rail | (toolbar + canvas) | right section panel */}
      <div className="flex flex-1 overflow-hidden">
        <FrameToolRail />
        <div className="flex flex-1 flex-col overflow-hidden">
          <FrameToolbar />
          <div className="relative flex-1 overflow-hidden">
            <FrameCanvas />
            {message && (
              <div
                className={`pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-md px-3 py-1.5 text-sm shadow ${
                  message.kind === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
        <FrameDetailsPanel lists={lists} costSettings={costSettings} />
      </div>
    </div>
  )
}
