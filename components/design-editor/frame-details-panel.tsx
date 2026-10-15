'use client'

import { useState } from 'react'
import { AlertCircle, Minus, Plus, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFrameStore, type SavedPanel } from '@/store/frame-editor'
import {
  WINDOW_TYPE_MAP,
  type WindowTypeId,
  type FrameSection,
  type PanelDir,
  type PanelAccessory,
} from '@/lib/design-editor/frame-model'
import { priceFrame, type PricingConfig } from '@/lib/design-editor/frame-pricing'
import {
  priceFrameBom,
  resolveBomInputs,
  type CostSettings,
} from '@/lib/design-editor/bom-pricing'
import { formatCurrency } from '@/lib/utils'

/** A profile series with its series-scoped profiles (track/sash/interlock…). */
export interface SeriesOption {
  id: string
  company: string
  series_name: string
  profiles: {
    profile_group: string
    profile_code: string | null
    name: string
    weight_per_meter: number
  }[]
}

export interface EditorLists {
  glasses: { name: string; rate: number }[]
  colors: { name: string }[]
  series: SeriesOption[]
  tracks: { name: string }[]
  sashes: { name: string }[]
  interlocks: { name: string }[]
  locks: { name: string }[]
  accessories: { id: string; kind: string; name: string; price: number }[]
  pricing: PricingConfig
}

/** Accessory kinds a section may configure, and which window types show them. */
export const SECTION_ACCESSORY_KINDS: {
  kind: string
  label: string
  types: WindowTypeId[]
  /** Only show when the section has mesh enabled. */
  requiresMesh?: boolean
}[] = [
  { kind: 'sash', label: 'Sash', types: ['sliding'] },
  { kind: 'interlock', label: 'Interlock', types: ['sliding'] },
  { kind: 'handle', label: 'Handle', types: ['sliding', 'casement', 'double-casement', 'door-single', 'door-double'] },
  { kind: 'roller', label: 'Roller', types: ['sliding'] },
  { kind: 'lock', label: 'Lock', types: ['sliding', 'casement', 'double-casement', 'door-single', 'door-double'] },
  { kind: 'hinge', label: 'Hinge', types: ['casement', 'double-casement', 'tophung', 'awning', 'door-single', 'door-double'] },
  { kind: 'friction_stay', label: 'Friction Stay / Hinges', types: ['casement', 'double-casement', 'tophung', 'awning', 'fixed-casement'] },
  // Mesh hardware — only when the section has mesh on.
  { kind: 'mesh_type', label: 'Mesh Type', types: ['casement', 'double-casement', 'mesh-screen', 'fly-screen'], requiresMesh: true },
  { kind: 'mesh_sash', label: 'Mesh Sash', types: ['casement', 'double-casement', 'mesh-screen', 'fly-screen'], requiresMesh: true },
  { kind: 'mesh_clip', label: 'Mesh Clip', types: ['casement', 'double-casement', 'mesh-screen', 'fly-screen'], requiresMesh: true },
  { kind: 'mesh_handle', label: 'Mesh Handle', types: ['casement', 'double-casement', 'mesh-screen', 'fly-screen'], requiresMesh: true },
  { kind: 'mesh_slim', label: 'Mesh Slim', types: ['casement', 'double-casement', 'mesh-screen', 'fly-screen'], requiresMesh: true },
]

/** Shape stored on `section.window.props.accessories`. */
export type SectionAccessories = Record<string, { id: string; name: string; price: number }>

function kindsForType(type: WindowTypeId, meshOn: boolean): typeof SECTION_ACCESSORY_KINDS {
  return SECTION_ACCESSORY_KINDS.filter(
    (k) => k.types.includes(type) && (!k.requiresMesh || meshOn)
  )
}

export function FrameDetailsPanel({
  lists,
  costSettings,
  onClose,
}: {
  lists: EditorLists
  costSettings?: Partial<CostSettings>
  onClose?: () => void
}) {
  const doc = useFrameStore((s) => s.doc)
  const selectedId = useFrameStore((s) => s.selectedSectionId)
  const patchDetails = useFrameStore((s) => s.patchDetails)
  const patchWindow = useFrameStore((s) => s.patchWindow)
  const clearSelectedWindow = useFrameStore((s) => s.clearSelectedWindow)

  const details = doc.details
  const selected = doc.sections.find((s) => s.id === selectedId) ?? null
  const selectSection = useFrameStore((s) => s.selectSection)

  // Price with the weight-based BOM engine when a series is selected; else the
  // legacy area × type-rate engine.
  const useBom = Boolean(details.seriesId)
  const price = priceFrame(doc, lists.pricing)
  const bom = useBom
    ? priceFrameBom(
        doc,
        resolveBomInputs({
          cost: costSettings,
          series: lists.series,
          seriesId: details.seriesId,
          glasses: lists.glasses,
          glassType: details.glassType,
        })
      )
    : null

  const issues: string[] = []
  if (!details.designRef.trim()) issues.push('Design Ref is required')
  if (!details.glassType) issues.push('Glass Type is required')

  const hasSliding = doc.sections.some((s) => s.window?.type === 'sliding')

  // Which panel view is shown. `auto` follows selection (section when one is
  // selected, else design); an explicit click pins it until selection changes.
  const [override, setOverride] = useState<{ id: number | null; tab: 'section' | 'design' } | null>(null)
  const pinned = override && override.id === selectedId ? override.tab : null
  const tab: 'section' | 'design' = pinned ?? (selected ? 'section' : 'design')
  const setTab = (t: 'section' | 'design') => setOverride({ id: selectedId, tab: t })

  const showSection = tab === 'section' && selected

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-gray-200 bg-white">
      {/* Header: tabs + close */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-1.5">
          {selected && (
            <TabPill active={tab === 'section'} onClick={() => setTab('section')}>
              {`S${selected.idx}`}
            </TabPill>
          )}
          <TabPill active={tab === 'design'} onClick={() => setTab('design')}>
            Details
          </TabPill>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {showSection ? (
          /* ---------------- SECTION VIEW (reference style) ---------------- */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                S{selected.idx}
                {selected.window && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {WINDOW_TYPE_MAP[selected.window.type]?.label}
                  </span>
                )}
              </h2>
              {selected.window && (
                <button
                  type="button"
                  onClick={clearSelectedWindow}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {selected.window ? (
              selected.window.type === 'sliding' ? (
                <SlidingPanelEditor section={selected} options={lists.accessories} />
              ) : (
                <>
                  <SectionProps
                    type={selected.window.type}
                    props={selected.window.props}
                    set={(patch) => patchWindow(selected.id, patch)}
                  />
                  <SectionAccessoryPanel
                    type={selected.window.type}
                    meshOn={selected.window.props.mesh === true}
                    accessories={(selected.window.props.accessories as SectionAccessories) ?? {}}
                    options={lists.accessories}
                    set={(next) => patchWindow(selected.id, { accessories: next })}
                  />
                </>
              )
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-xs text-gray-400">
                Drop a window from the left rail onto this section.
              </p>
            )}

            <button
              type="button"
              onClick={() => selectSection(null)}
              className="w-full rounded-md border border-gray-200 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50"
            >
              Back to design details
            </button>
          </div>
        ) : (
          /* ---------------- DESIGN VIEW ---------------- */
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Design Ref" required>
                <Input value={details.designRef} onChange={(e) => patchDetails({ designRef: e.target.value })} />
              </Field>
              <Field label="Design Name">
                <Input value={details.designName} placeholder="e.g. Living Room" onChange={(e) => patchDetails({ designName: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Width (mm)">
                <Input type="number" min={300} value={doc.width} onChange={(e) => useFrameStore.getState().setFrameSize(Math.max(300, Number(e.target.value) || 0), doc.height)} />
              </Field>
              <Field label="Height (mm)">
                <Input type="number" min={300} value={doc.height} onChange={(e) => useFrameStore.getState().setFrameSize(doc.width, Math.max(300, Number(e.target.value) || 0))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Rate / Sqft (₹)" hint="blank = auto">
                <Input
                  type="number"
                  min={0}
                  placeholder="auto"
                  value={details.ratePerSqft ?? ''}
                  onChange={(e) =>
                    patchDetails({ ratePerSqft: e.target.value === '' ? null : Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Quantity">
                <div className="flex items-center gap-1">
                  <IconStep icon={Minus} onClick={() => patchDetails({ quantity: Math.max(1, details.quantity - 1) })} />
                  <Input type="number" min={1} value={details.quantity} className="text-center" onChange={(e) => patchDetails({ quantity: Math.max(1, Number(e.target.value) || 1) })} />
                  <IconStep icon={Plus} onClick={() => patchDetails({ quantity: details.quantity + 1 })} />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Colour">
                <Select value={details.colour} onChange={(e) => patchDetails({ colour: e.target.value })}>
                  {lists.colors.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Glass Type" required>
                <Select value={details.glassType} onChange={(e) => patchDetails({ glassType: e.target.value })}>
                  <option value="">Select glass...</option>
                  {lists.glasses.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Location">
                <Input value={details.location} onChange={(e) => patchDetails({ location: e.target.value })} />
              </Field>
              <Field label="Floor No">
                <Input value={details.floorNo} onChange={(e) => patchDetails({ floorNo: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Material">
                <Select
                  value={details.material ?? 'aluminium'}
                  onChange={(e) => patchDetails({ material: e.target.value as 'aluminium' | 'upvc' })}
                >
                  <option value="aluminium">Aluminium</option>
                  <option value="upvc">uPVC</option>
                </Select>
              </Field>
              <Field label="Series" hint="drives pricing">
                <Select
                  value={details.seriesId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value
                    const s = lists.series.find((x) => x.id === id)
                    patchDetails({ seriesId: id || undefined, series: s?.series_name })
                  }}
                >
                  <option value="">Select series…</option>
                  {lists.series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.company} · {s.series_name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* GI hardware — only relevant when a sliding window is present */}
            {hasSliding && (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  GI Hardware (sliding)
                </p>
                <GiSelect label="Outer (Track)" value={details.track} options={lists.tracks} onChange={(v) => patchDetails({ track: v })} />
                <GiSelect label="Sash" value={details.sash} options={lists.sashes} onChange={(v) => patchDetails({ sash: v })} />
                <GiSelect label="Interlock" value={details.interlock} options={lists.interlocks} onChange={(v) => patchDetails({ interlock: v })} />
                <GiSelect label="Lock" value={details.lock} options={lists.locks} onChange={(v) => patchDetails({ lock: v })} />
              </div>
            )}

            <Field label="Message">
              <Textarea value={details.message} rows={3} onChange={(e) => patchDetails({ message: e.target.value })} />
            </Field>
          </>
        )}

        {/* Live pricing (pre-tax base; GST + install are applied on the
            quotation's Pricing page, not per design). */}
        {bom ? (
          <div className="space-y-1 rounded-lg bg-gray-900 p-3 text-white">
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              <span>Weight-based BOM</span>
              <span>{bom.weightKg.toFixed(1)} kg</span>
            </div>
            <Row label="Area" value={`${bom.areaSqft.toFixed(2)} Sqft`} />
            <Row label="Aluminium" value={formatCurrency(bom.aluminiumCost)} />
            {bom.coatingCost > 0 && <Row label="Coating" value={formatCurrency(bom.coatingCost)} />}
            <Row label="Glass" value={formatCurrency(bom.glassCost)} />
            {bom.hardwareCost > 0 && <Row label="Hardware" value={formatCurrency(bom.hardwareCost)} />}
            {bom.consumablesCost > 0 && <Row label="Consumables" value={formatCurrency(bom.consumablesCost)} />}
            <Row label="Labour" value={formatCurrency(bom.labourCost)} />
            <div className="mt-1 flex items-center justify-between border-t border-white/20 pt-1 text-xs">
              <span>Subtotal</span>
              <span>{formatCurrency(bom.subtotal)}</span>
            </div>
            {bom.profit > 0 && <Row label={`Profit`} value={formatCurrency(bom.profit)} />}
            {bom.quantity > 1 && <Row label="Qty" value={`× ${bom.quantity}`} />}
            <div className="mt-1 flex items-center justify-between border-t border-white/20 pt-1 text-sm font-bold">
              <span>Base Total</span>
              <span>{formatCurrency(bom.total)}</span>
            </div>
            <p className="pt-0.5 text-[10px] leading-snug text-white/50">
              {bom.ratePerSqft > 0 && `≈ ${formatCurrency(bom.ratePerSqft)}/sqft · `}
              GST &amp; installation are applied on the quotation&apos;s Pricing page.
            </p>
          </div>
        ) : (
          <div className="space-y-1 rounded-lg bg-gray-900 p-3 text-white">
            <Row label="Area" value={`${price.areaSqft.toFixed(2)} Sqft`} />
            {price.accessoriesTotal > 0 && (
              <Row label="Accessories" value={formatCurrency(price.accessoriesTotal)} />
            )}
            <Row label="Base (per unit)" value={formatCurrency(price.subtotal)} />
            {price.quantity > 1 && <Row label="Qty" value={`× ${price.quantity}`} />}
            <div className="mt-1 flex items-center justify-between border-t border-white/20 pt-1 text-sm font-bold">
              <span>Base Total</span>
              <span>{formatCurrency(price.subtotal * price.quantity)}</span>
            </div>
            <p className="pt-0.5 text-[10px] leading-snug text-white/50">
              Select a Series for weight-based pricing. GST &amp; installation are applied on the
              quotation&apos;s Pricing page.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-gray-200 bg-gray-50/60 p-4">
        {issues.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{issues.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

/* ---------- per-type conditional controls ---------- */

function SectionProps({
  type,
  props,
  set,
}: {
  type: string
  props: Record<string, unknown>
  set: (patch: Record<string, unknown>) => void
}) {
  switch (type) {
    case 'sliding':
      return (
        <>
          <Pills label="Panels" options={[[2, '2 Panel'], [3, '3 Panel']]} val={Number(props.panels) || 2} set={(v) => set({ panels: v, panelDirs: v === 3 ? ['left', 'right', 'left'] : ['right', 'left'] })} />
          <Pills label="Mesh" options={[[true, 'With Mesh'], [false, 'No Mesh']]} val={props.mesh === true} set={(v) => set({ mesh: v })} />
          <Pills label="Profile" options={[[false, 'Standard'], [true, 'Slim']]} val={props.slimProfile === true} set={(v) => set({ slimProfile: v })} />
        </>
      )
    case 'casement':
    case 'double-casement':
      return (
        <>
          {type === 'casement' && (
            <Pills label="Hinge Side" options={[['left', '⬅ Left'], ['right', 'Right ➡']]} val={(props.hingeSide as string) || 'left'} set={(v) => set({ hingeSide: v })} />
          )}
          <Pills label="Window Openable Type" options={[['outward', '↗ Outward'], ['inward', '↙ Inward']]} val={(props.openDir as string) || 'outward'} set={(v) => set({ openDir: v })} />
          <Pills label="Glazing Bar" options={[[false, 'None'], [true, 'Grid']]} val={props.glazingBar === true} set={(v) => set({ glazingBar: v })} />
          <Pills label="Mesh" options={[[false, 'No Mesh'], [true, 'With Mesh']]} val={props.mesh === true} set={(v) => set({ mesh: v })} />
        </>
      )
    case 'fixed':
    case 'fixed-casement':
      return (
        <Pills label="Grids" options={[['none', 'None'], ['cross', 'Cross']]} val={(props.grids as string) || 'none'} set={(v) => set({ grids: v })} />
      )
    case 'tophung':
      return (
        <Pills label="Opening" options={[['outward', '↗ Outward'], ['inward', '↙ Hopper']]} val={(props.openDir as string) || 'outward'} set={(v) => set({ openDir: v })} />
      )
    case 'awning':
      return <p className="text-xs text-gray-500">Top-hinged, opens outward.</p>
    case 'louvered':
      return (
        <NumberField label="Blades" min={3} max={20} val={Number(props.blades) || 6} set={(v) => set({ blades: v })} />
      )
    case 'door-single':
      return (
        <>
          <Pills label="Hinge Side" options={[['left', '⬅ Left'], ['right', 'Right ➡']]} val={(props.hingeSide as string) || 'left'} set={(v) => set({ hingeSide: v })} />
          <Pills label="Open" options={[['inward', 'Inward'], ['outward', 'Outward']]} val={(props.openDir as string) || 'inward'} set={(v) => set({ openDir: v })} />
          <Pills label="Panel Style" options={[['panel', 'Panel'], ['glass', 'Glass'], ['flush', 'Flush']]} val={(props.panelStyle as string) || 'panel'} set={(v) => set({ panelStyle: v })} />
        </>
      )
    case 'door-double':
      return (
        <>
          <Pills label="Open" options={[['inward', 'Inward'], ['outward', 'Outward']]} val={(props.openDir as string) || 'inward'} set={(v) => set({ openDir: v })} />
          <Pills label="Panel Style" options={[['panel', 'Panel'], ['glass', 'Glass'], ['flush', 'Flush']]} val={(props.panelStyle as string) || 'panel'} set={(v) => set({ panelStyle: v })} />
        </>
      )
    case 'ventilator':
      return (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Rows" min={1} max={8} val={Number(props.rows) || 3} set={(v) => set({ rows: v })} />
          <NumberField label="Cols" min={1} max={10} val={Number(props.cols) || 5} set={(v) => set({ cols: v })} />
        </div>
      )
    case 'exhaust-fan':
    case 'exhaust-fan-rect':
      return (
        <NumberField label="Blades" min={3} max={8} val={Number(props.blades) || 4} set={(v) => set({ blades: v })} />
      )
    case 'ac-sleeve':
      return <NumberField label="Louvers" min={2} max={12} val={Number(props.louverCount) || 5} set={(v) => set({ louverCount: v })} />
    case 'glass-block':
      return (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Rows" min={1} max={8} val={Number(props.rows) || 2} set={(v) => set({ rows: v })} />
          <NumberField label="Cols" min={1} max={10} val={Number(props.cols) || 4} set={(v) => set({ cols: v })} />
        </div>
      )
    case 'georgian-bars':
      return (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Vert divs" min={1} max={8} val={Number(props.gridDivX) || 3} set={(v) => set({ gridDivX: v })} />
          <NumberField label="Horiz divs" min={1} max={8} val={Number(props.gridDivY) || 2} set={(v) => set({ gridDivY: v })} />
        </div>
      )
    case 'roller-shutter':
      return <NumberField label="Slats" min={4} max={30} val={Number(props.slatCount) || 12} set={(v) => set({ slatCount: v })} />
    case 'roller-blind':
      return <NumberField label="Slats" min={4} max={20} val={Number(props.slatCount) || 8} set={(v) => set({ slatCount: v })} />
    case 'grille':
      return <NumberField label="Bar spacing (mm)" min={40} max={300} step={10} val={Number(props.barSpacing) || 100} set={(v) => set({ barSpacing: v })} />
    case 'frosted-film':
      return <NumberField label="Opacity %" min={10} max={100} step={5} val={Number(props.opacity) || 80} set={(v) => set({ opacity: v })} />
    default:
      return <p className="text-xs text-gray-500">No extra options.</p>
  }
}

/* ---------- per-panel (palla) editor for sliding windows ---------- */

/** Accessory kinds shown for a sliding panel (reference parity). */
const SLIDING_PANEL_KINDS: { kind: string; label: string; required?: boolean }[] = [
  { kind: 'interlock', label: 'Interlock', required: true },
  { kind: 'handle', label: 'Handle', required: true },
  { kind: 'roller', label: 'Roller', required: true },
  { kind: 'lock', label: 'Lock' },
]

/** Extra accessory kinds shown only when the sliding window uses a slim profile. */
const SLIM_PANEL_KINDS: { kind: string; label: string; required?: boolean }[] = [
  { kind: 'slim_interlock', label: 'Slim Interlock', required: true },
  { kind: 'reinforcement', label: 'Reinforcement' },
]

function SlidingPanelEditor({
  section,
  options,
}: {
  section: FrameSection
  options: EditorLists['accessories']
}) {
  const selectedPanelIdx = useFrameStore((s) => s.selectedPanelIdx)
  const selectPanel = useFrameStore((s) => s.selectPanel)
  const setPanelDir = useFrameStore((s) => s.setPanelDir)
  const setPanelHandle = useFrameStore((s) => s.setPanelHandle)
  const patchPanelAccessory = useFrameStore((s) => s.patchPanelAccessory)
  const saveCurrentPanel = useFrameStore((s) => s.saveCurrentPanel)
  const applySavedPanel = useFrameStore((s) => s.applySavedPanel)
  const removeSavedPanel = useFrameStore((s) => s.removeSavedPanel)
  const savedPanels = useFrameStore((s) => s.savedPanels)

  const props = section.window!.props
  const panels = Math.max(1, Number(props.panels) || 2)
  const dirs = (props.panelDirs as PanelDir[]) ?? []
  const handles = (props.panelHandles as ('left' | 'right')[]) ?? []
  const acc = (props.panelAccessories as Partial<Record<string, PanelAccessory>>[]) ?? []

  // Fall back to the first panel if none is explicitly selected yet.
  const idx = selectedPanelIdx != null && selectedPanelIdx < panels ? selectedPanelIdx : 0
  const dir = dirs[idx] ?? 'right'
  const handle = handles[idx] ?? 'right'
  const panelAcc = acc[idx] ?? {}
  const isFixed = dir === 'fixed'
  const isSlim = props.slimProfile === true

  const sashOptions = options.filter((o) => o.kind === 'sash')

  const chooseAccessory = (kind: string, id: string) => {
    if (!id) {
      patchPanelAccessory(section.id, idx, kind, null)
      return
    }
    const opt = options.find((o) => o.id === id && o.kind === kind)
    if (opt) patchPanelAccessory(section.id, idx, kind, { id: opt.id, name: opt.name, price: opt.price })
  }

  return (
    <div className="space-y-4">
      {/* Panel chooser row */}
      {panels > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: panels }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectPanel(i)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                i === idx
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary/50'
              }`}
            >
              S{section.idx}.{i + 1}
            </button>
          ))}
        </div>
      )}

      {/* PANEL TYPE */}
      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-wide text-gray-500">Panel Type</Label>
        <div className="grid grid-cols-2 gap-2">
          <TypeButton
            active={!isFixed}
            label="🔄 Sliding"
            tone="sliding"
            onClick={() => setPanelDir(section.id, idx, 'right')}
          />
          <TypeButton
            active={isFixed}
            label="🪟 Fixed"
            tone="fixed"
            onClick={() => setPanelDir(section.id, idx, 'fixed')}
          />
        </div>
      </div>

      {/* HANDLE POSITION — sliding only */}
      {!isFixed && (
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wide text-gray-500">Handle Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <TypeButton active={handle === 'left'} label="◀ Left" tone="neutral" onClick={() => setPanelHandle(section.id, idx, 'left')} />
            <TypeButton active={handle === 'right'} label="Right ▶" tone="neutral" onClick={() => setPanelHandle(section.id, idx, 'right')} />
          </div>
        </div>
      )}

      {/* SASH — always */}
      <PanelSelect
        label="Sash"
        required
        value={panelAcc.sash?.id ?? ''}
        options={sashOptions}
        onChange={(id) => chooseAccessory('sash', id)}
      />

      {/* ACCESSORIES — sliding only */}
      {!isFixed && (
        <div className="space-y-3">
          <div className="border-b border-primary/30 pb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Accessories
          </div>
          {[...SLIDING_PANEL_KINDS, ...(isSlim ? SLIM_PANEL_KINDS : [])].map(
            ({ kind, label, required }) => (
              <PanelSelect
                key={kind}
                label={label}
                required={required}
                value={panelAcc[kind]?.id ?? ''}
                options={options.filter((o) => o.kind === kind)}
                onChange={(id) => chooseAccessory(kind, id)}
              />
            )
          )}
        </div>
      )}

      {/* Save this panel */}
      <button
        type="button"
        onClick={saveCurrentPanel}
        className="w-full rounded-md border border-primary/40 bg-primary-soft/40 py-2 text-xs font-semibold text-primary hover:bg-primary-soft/70"
      >
        Save this panel
      </button>

      {/* SAVED PANELS */}
      {savedPanels.length > 0 && (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/70 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
            Saved Panels ({savedPanels.length})
          </p>
          <div className="space-y-1.5">
            {savedPanels.map((p, i) => (
              <SavedPanelRow
                key={`${p.sectionLabel}-${i}`}
                panel={p}
                onApply={() => applySavedPanel(p)}
                onRemove={() => removeSavedPanel(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SavedPanelRow({
  panel,
  onApply,
  onRemove,
}: {
  panel: SavedPanel
  onApply: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5">
      <button type="button" onClick={onApply} className="text-xs font-semibold text-primary hover:underline">
        {panel.sectionLabel}
      </button>
      <span className="flex-1 truncate text-[11px] text-gray-500">
        {panel.widthMm}×{panel.heightMm}mm{panel.sash ? ` · ${panel.sash}` : ''}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-0.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
        aria-label="Remove saved panel"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

function TypeButton({
  active,
  label,
  tone,
  onClick,
}: {
  active: boolean
  label: string
  tone: 'sliding' | 'fixed' | 'neutral'
  onClick: () => void
}) {
  const activeCls =
    tone === 'sliding'
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : tone === 'fixed'
        ? 'border-sky-500 bg-sky-50 text-sky-700'
        : 'border-primary bg-primary-soft/50 text-primary'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 py-2.5 text-xs font-bold transition-colors ${
        active ? activeCls : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

function PanelSelect({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string
  required?: boolean
  value: string
  options: EditorLists['accessories']
  onChange: (id: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-gray-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">
          {options.length ? `— Select ${label.toLowerCase()} —` : `No ${label.toLowerCase()} configured`}
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
            {o.price ? ` — ${formatCurrency(o.price)}` : ''}
          </option>
        ))}
      </Select>
    </div>
  )
}

/* ---------- per-section accessories ---------- */

function SectionAccessoryPanel({
  type,
  meshOn,
  accessories,
  options,
  set,
}: {
  type: WindowTypeId
  meshOn: boolean
  accessories: SectionAccessories
  options: EditorLists['accessories']
  set: (next: SectionAccessories) => void
}) {
  const kinds = kindsForType(type, meshOn)
  if (kinds.length === 0) return null

  const update = (kind: string, id: string) => {
    const next: SectionAccessories = { ...accessories }
    if (!id) {
      delete next[kind]
    } else {
      const opt = options.find((o) => o.id === id && o.kind === kind)
      if (opt) next[kind] = { id: opt.id, name: opt.name, price: opt.price }
    }
    set(next)
  }

  const total = Object.values(accessories).reduce((sum, a) => sum + (a?.price ?? 0), 0)

  return (
    <div className="space-y-2 rounded-md border border-blue-200/70 bg-white/70 p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Accessories</p>
      {kinds.map(({ kind, label }) => {
        const opts = options.filter((o) => o.kind === kind)
        const current = accessories[kind]?.id ?? ''
        return (
          <div key={kind} className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-gray-500">{label}</Label>
            <Select value={current} onChange={(e) => update(kind, e.target.value)}>
              <option value="">
                {opts.length ? `Select ${label.toLowerCase()}...` : `No ${label.toLowerCase()} configured`}
              </option>
              {opts.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.price ? ` — ${formatCurrency(o.price)}` : ''}
                </option>
              ))}
            </Select>
          </div>
        )
      })}
      {total > 0 && (
        <div className="flex items-center justify-between pt-0.5 text-[11px] font-medium text-blue-700">
          <span>Accessories total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  )
}

/* ---------- small controls ---------- */

function Pills<T extends string | number | boolean>({
  label,
  options,
  val,
  set,
}: {
  label: string
  options: [T, string][]
  val: T
  set: (v: T) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-gray-500">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, text]) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => set(v)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              val === v ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

function NumberField({
  label,
  val,
  set,
  min,
  max,
  step = 1,
}: {
  label: string
  val: number
  set: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-gray-500">{label}</Label>
      <Input
        type="number"
        value={val}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          let n = Number(e.target.value) || 0
          if (min != null) n = Math.max(min, n)
          if (max != null) n = Math.min(max, n)
          set(n)
        }}
      />
    </div>
  )
}

function GiSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value?: string
  options: { name: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-gray-500">{label}</Label>
      <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select {label.toLowerCase()}...</option>
        {options.map((o) => (
          <option key={o.name} value={o.name}>{o.name}</option>
        ))}
      </Select>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="ml-1 normal-case text-gray-400">({hint})</span>}
      </Label>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-gray-300">
      <span>{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}

function IconStep({ icon: Icon, onClick }: { icon: React.ComponentType<{ className?: string }>; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-input text-gray-600 hover:bg-gray-100">
      <Icon className="h-4 w-4" />
    </button>
  )
}
