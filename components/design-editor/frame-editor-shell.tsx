'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Save, Loader2, Undo2, Redo2, Trash2 } from 'lucide-react'
import { useFrameStore } from '@/store/frame-editor'
import { type FrameDocument } from '@/lib/design-editor/frame-model'
import { framePersistedPricing, DEFAULT_PRICING, type PricingConfig } from '@/lib/design-editor/frame-pricing'
import { FrameToolRail } from './frame-tool-rail'
import { FrameCanvas } from './frame-canvas'
import { FrameDetailsPanel, type EditorLists } from './frame-details-panel'

const FALLBACK_LISTS: EditorLists = {
  glasses: [
    { name: '4MM CLEAR GLASS' },
    { name: '5MM CLEAR GLASS' },
    { name: '5MM CLEAR TOUGHENED GLASS' },
    { name: '6MM TINTED GLASS' },
    { name: '6MM TOUGHENED GLASS' },
    { name: '8MM TOUGHENED GLASS' },
    { name: 'DOUBLE GLAZED UNIT' },
  ],
  colors: [
    { name: 'White' }, { name: 'Black' }, { name: 'Grey' }, { name: 'Brown' },
    { name: 'Bronze' }, { name: 'Wood Finish' }, { name: 'Anodized' },
  ],
  tracks: [{ name: '2 Track' }, { name: '3 Track' }, { name: 'Slim Track' }],
  sashes: [{ name: 'Standard Sash' }, { name: 'Slim Sash' }],
  interlocks: [{ name: 'Standard Interlock' }, { name: 'Slim Interlock' }],
  locks: [{ name: 'SLD TOUCH LOCK LEFT' }, { name: 'SLD TOUCH LOCK RIGHT' }, { name: 'Mortise Lock' }],
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
  const undo = useFrameStore((s) => s.undo)
  const redo = useFrameStore((s) => s.redo)
  const clearAll = useFrameStore((s) => s.clearAll)
  const doc = useFrameStore((s) => s.doc)
  const message = useFrameStore((s) => s.message)
  const details = doc.details

  const [lists, setLists] = useState<EditorLists>(FALLBACK_LISTS)
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
        const [glasses, colors, tracks, sashes, interlocks, locks, rates, cfg] =
          await Promise.all([
            supabase.from('design_glasses').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('design_colors').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('gi_tracks').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('gi_sashes').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('gi_interlocks').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('gi_locks').select('name').eq('is_active', true).order('sort_order'),
            supabase.from('design_type_rates').select('window_type, base_rate'),
            supabase.from('design_pricing_config').select('*').eq('id', 1).maybeSingle(),
          ])
        if (!active) return

        // If the tables aren't there yet, keep fallbacks.
        if (!glasses.data) return

        const typeRates: Record<string, number> = { ...DEFAULT_PRICING.typeRates }
        for (const r of rates.data ?? []) typeRates[r.window_type] = Number(r.base_rate)
        const pricing: PricingConfig = {
          typeRates,
          gstPercentage: Number(cfg.data?.gst_percentage ?? DEFAULT_PRICING.gstPercentage),
          installPercentage: Number(cfg.data?.install_percentage ?? DEFAULT_PRICING.installPercentage),
        }

        setLists({
          glasses: glasses.data?.length ? glasses.data : FALLBACK_LISTS.glasses,
          colors: colors.data?.length ? colors.data : FALLBACK_LISTS.colors,
          tracks: tracks.data?.length ? tracks.data : FALLBACK_LISTS.tracks,
          sashes: sashes.data?.length ? sashes.data : FALLBACK_LISTS.sashes,
          interlocks: interlocks.data?.length ? interlocks.data : FALLBACK_LISTS.interlocks,
          locks: locks.data?.length ? locks.data : FALLBACK_LISTS.locks,
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

      const pricing = framePersistedPricing(current, lists.pricing)
      const first = current.sections.find((s) => s.window)!.window!

      const row = {
        name: current.details.designName || current.details.designRef || 'Untitled',
        window_type: first.type,
        width: current.width,
        height: current.height,
        profile_type: 'aluminium',
        glass_type: current.details.glassType || 'clear',
        glass_thickness: 5,
        color: current.details.colour,
        editor_document: current,
        area_sqft: pricing.areaSqft,
        rate_per_sqft: pricing.ratePerSqft,
        amount: pricing.amount,
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
          <IconBtn title="Undo" onClick={undo}><Undo2 className="h-4 w-4" /></IconBtn>
          <IconBtn title="Redo" onClick={redo}><Redo2 className="h-4 w-4" /></IconBtn>
          <IconBtn title="Clear" onClick={clearAll}><Trash2 className="h-4 w-4" /></IconBtn>
          {error && (
            <span className="rounded-md bg-red-50 px-2.5 py-1 text-sm text-red-600">{error}</span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <FrameToolRail />
        <FrameDetailsPanel lists={lists} />
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
    </div>
  )
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
    >
      {children}
    </button>
  )
}
