'use client'

import { AlertCircle, Minus, Plus, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFrameStore } from '@/store/frame-editor'
import { WINDOW_TYPE_MAP } from '@/lib/design-editor/frame-model'
import { priceFrame, type PricingConfig } from '@/lib/design-editor/frame-pricing'
import { formatCurrency } from '@/lib/utils'

export interface EditorLists {
  glasses: { name: string }[]
  colors: { name: string }[]
  tracks: { name: string }[]
  sashes: { name: string }[]
  interlocks: { name: string }[]
  locks: { name: string }[]
  pricing: PricingConfig
}

export function FrameDetailsPanel({
  lists,
  onClose,
}: {
  lists: EditorLists
  onClose?: () => void
}) {
  const doc = useFrameStore((s) => s.doc)
  const selectedId = useFrameStore((s) => s.selectedSectionId)
  const patchDetails = useFrameStore((s) => s.patchDetails)
  const patchWindow = useFrameStore((s) => s.patchWindow)
  const clearSelectedWindow = useFrameStore((s) => s.clearSelectedWindow)

  const details = doc.details
  const selected = doc.sections.find((s) => s.id === selectedId) ?? null
  const price = priceFrame(doc, lists.pricing)

  const issues: string[] = []
  if (!details.designRef.trim()) issues.push('Design Ref is required')
  if (!details.glassType) issues.push('Glass Type is required')

  const hasSliding = doc.sections.some((s) => s.window?.type === 'sliding')

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-900">Design Details</h2>
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
        {/* Design-level */}
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

        {/* Selected-section properties */}
        {selected && (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                Section {selected.idx}
                {selected.window ? ` · ${WINDOW_TYPE_MAP[selected.window.type]?.label}` : ''}
              </p>
              {selected.window && (
                <button
                  type="button"
                  onClick={clearSelectedWindow}
                  className="flex items-center gap-1 text-[11px] text-rose-600 hover:underline"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            {selected.window ? (
              <SectionProps
                type={selected.window.type}
                props={selected.window.props}
                set={(patch) => patchWindow(selected.id, patch)}
              />
            ) : (
              <p className="text-xs text-blue-700/70">Drop a window into this section.</p>
            )}
          </div>
        )}

        <Field label="Message">
          <Textarea value={details.message} rows={3} onChange={(e) => patchDetails({ message: e.target.value })} />
        </Field>

        {/* Live pricing */}
        <div className="space-y-1 rounded-lg bg-gray-900 p-3 text-white">
          <Row label="Area" value={`${price.areaSqft.toFixed(2)} Sqft`} />
          <Row label="Subtotal" value={formatCurrency(price.subtotal)} />
          <Row label={`GST (${lists.pricing.gstPercentage}%)`} value={formatCurrency(price.gst)} />
          <Row label={`Install (${lists.pricing.installPercentage}%)`} value={formatCurrency(price.install)} />
          {price.quantity > 1 && <Row label="Qty" value={`× ${price.quantity}`} />}
          <div className="mt-1 flex items-center justify-between border-t border-white/20 pt-1 text-sm font-bold">
            <span>Total</span>
            <span>{formatCurrency(price.total)}</span>
          </div>
        </div>
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
          <Pills label="Opening" options={[['outward', '↗ Outward'], ['inward', '↙ Inward']]} val={(props.openDir as string) || 'outward'} set={(v) => set({ openDir: v })} />
          <Pills label="Glazing Bar" options={[[false, 'None'], [true, 'Grid']]} val={props.glazingBar === true} set={(v) => set({ glazingBar: v })} />
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
