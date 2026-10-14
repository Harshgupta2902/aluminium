/**
 * Pricing engine for the section-based design editor.
 *
 * Mirrors the reference editor:
 *   - A per-sqft rate derived from a size curve `fr()` (flat below 1500mm,
 *     logarithmic above) times a per-window-type base rate.
 *   - GST and installation added as configurable percentages.
 *
 * Config (per-type base rates, GST, install) is loaded from Supabase but this
 * module stays pure: callers pass a resolved `PricingConfig`. Fallback defaults
 * match the reference so pricing works before the tables are seeded.
 */

import { calculateGlassArea } from '@/lib/calculations'
import type { FrameDocument, FrameSection, WindowTypeId } from './frame-model'

export interface PricingConfig {
  /** Base rate per window type (₹). */
  typeRates: Record<string, number>
  gstPercentage: number
  installPercentage: number
}

/** Reference defaults (Dv + gst/install) used when config isn't loaded yet. */
export const DEFAULT_PRICING: PricingConfig = {
  typeRates: {
    fixed: 850,
    sliding: 1100,
    casement: 1350,
    'double-casement': 1350,
    'fixed-casement': 1200,
    tophung: 1250,
    louvered: 950,
    awning: 1200,
    'door-single': 2500,
    'door-double': 4200,
    ventilator: 700,
    'exhaust-fan': 600,
    'exhaust-fan-rect': 600,
    'ac-sleeve': 800,
    'glass-block': 900,
    'georgian-bars': 1000,
    'roller-shutter': 1400,
    skylight: 1600,
    grille: 750,
    'mesh-screen': 500,
    'roller-blind': 650,
    'fly-screen': 500,
    'frosted-film': 300,
  },
  gstPercentage: 18,
  installPercentage: 10,
}

/* Reference curve constants. */
const REF = 1500
const RY = REF * 0.37 // 555
const SLOPE = 87

/**
 * Size curve `fr(e, l)` from the reference. Returns a scaling value for a
 * dimension `e` against a reference span `l`.
 */
export function sizeCurve(e: number, l: number): number {
  if (e <= REF) return e * 0.37
  const capped = RY + SLOPE * Math.log(l / REF)
  return e >= l ? capped : RY + SLOPE * Math.log(e / REF)
}

/**
 * A size multiplier in [~0.6, ~1.4] derived from the larger dimension, so
 * larger windows cost a little more per sqft and small ones a little less.
 * Normalised around a 1500mm reference span.
 */
export function sizeMultiplier(widthMm: number, heightMm: number): number {
  const span = Math.max(widthMm, heightMm, 1)
  const curved = sizeCurve(span, Math.max(span, REF))
  const baseline = sizeCurve(REF, REF) // = 555
  const m = curved / baseline
  return Math.min(1.5, Math.max(0.6, m))
}

/** Area of a rectangle in sq ft (mm -> sqft, shared with the rest of the app). */
export function rectAreaSqft(widthMm: number, heightMm: number): number {
  return calculateGlassArea({ width: widthMm, height: heightMm })
}

export interface SectionPrice {
  sectionId: number
  type: WindowTypeId | null
  areaSqft: number
  ratePerSqft: number
  /** Glass/profile cost (area × rate). */
  glassAmount: number
  /** Summed price of configured accessories on this section. */
  accessoriesAmount: number
  /** glassAmount + accessoriesAmount. */
  amount: number
}

/** Sum a flat accessory map ({ kind: { price } }). */
function sumAccessoryMap(acc: unknown): number {
  if (!acc || typeof acc !== 'object') return 0
  let sum = 0
  for (const entry of Object.values(acc as Record<string, { price?: number } | null>)) {
    const price = Number(entry?.price)
    if (Number.isFinite(price) && price > 0) sum += price
  }
  return sum
}

/**
 * Sum the price of accessories configured on a section window.
 * Sliding windows carry per-panel accessories (panelAccessories[]); other
 * types carry a single section-level accessories map.
 */
function sectionAccessoriesAmount(section: FrameSection): number {
  const props = section.window?.props
  if (!props) return 0

  let sum = 0
  // Section-level accessories (non-sliding, or legacy).
  sum += sumAccessoryMap(props.accessories)
  // Per-panel accessories (sliding).
  const panelAcc = props.panelAccessories
  if (Array.isArray(panelAcc)) {
    for (const panel of panelAcc) sum += sumAccessoryMap(panel)
  }
  return Math.round(sum)
}

export interface FramePrice {
  sections: SectionPrice[]
  /** Total glass/opening area across sections (sq ft), per unit. */
  areaSqft: number
  /** Total accessory cost across sections, per unit. */
  accessoriesTotal: number
  /** Subtotal before GST + install (glass + accessories). */
  subtotal: number
  gst: number
  install: number
  /** subtotal + gst + install, for one unit. */
  unitTotal: number
  quantity: number
  /** unitTotal * quantity. */
  total: number
  /** Blended rate per sqft (total per-unit / area), for display + storage. */
  blendedRatePerSqft: number
}

/**
 * Price a whole frame document.
 *
 * The per-section rate is: base type rate * size multiplier. If the design has
 * an explicit `details.ratePerSqft`, that OVERRIDES the computed base rate for
 * every section (manual override), still scaled by the size multiplier is NOT
 * applied in override mode — the user's number is used verbatim.
 */
export function priceFrame(
  doc: FrameDocument,
  config: PricingConfig = DEFAULT_PRICING
): FramePrice {
  const manualRate = doc.details.ratePerSqft
  const useManual = typeof manualRate === 'number' && manualRate > 0

  const sections: SectionPrice[] = doc.sections.map((s) => priceSection(s, config, useManual ? manualRate! : null))

  const areaSqft = round2(sections.reduce((sum, s) => sum + s.areaSqft, 0))
  const accessoriesTotal = Math.round(sections.reduce((sum, s) => sum + s.accessoriesAmount, 0))
  const subtotal = Math.round(sections.reduce((sum, s) => sum + s.amount, 0))
  const gst = Math.round((subtotal * config.gstPercentage) / 100)
  const install = Math.round((subtotal * config.installPercentage) / 100)
  const unitTotal = subtotal + gst + install
  const quantity = Math.max(1, doc.details.quantity || 1)
  const total = unitTotal * quantity
  const blendedRatePerSqft = areaSqft > 0 ? Math.round(unitTotal / areaSqft) : 0

  return {
    sections,
    areaSqft,
    accessoriesTotal,
    subtotal,
    gst,
    install,
    unitTotal,
    quantity,
    total,
    blendedRatePerSqft,
  }
}

function priceSection(
  section: FrameSection,
  config: PricingConfig,
  manualRate: number | null
): SectionPrice {
  // Arc band is a half-ellipse (~π/4 of its bounding box), not a full rect.
  const bandFactor = section.band === 'arc' ? Math.PI / 4 : 1
  const areaSqft = round2(rectAreaSqft(section.sw, section.sh) * bandFactor)
  const type = section.window?.type ?? null

  if (!type) {
    return {
      sectionId: section.id,
      type: null,
      areaSqft,
      ratePerSqft: 0,
      glassAmount: 0,
      accessoriesAmount: 0,
      amount: 0,
    }
  }

  let ratePerSqft: number
  if (manualRate != null) {
    ratePerSqft = manualRate
  } else {
    const base = config.typeRates[type] ?? DEFAULT_PRICING.typeRates[type] ?? 800
    ratePerSqft = Math.round(base * sizeMultiplier(section.sw, section.sh))
  }
  const glassAmount = Math.round(areaSqft * ratePerSqft)
  const accessoriesAmount = sectionAccessoriesAmount(section)
  const amount = glassAmount + accessoriesAmount
  return {
    sectionId: section.id,
    type,
    areaSqft,
    ratePerSqft,
    glassAmount,
    accessoriesAmount,
    amount,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * The fields persisted on window_designs for quotation aggregation.
 *
 * IMPORTANT: `amount` is now the PRE-TAX base (glass + accessories), per unit
 * times quantity. GST and installation are applied once at the QUOTATION level
 * (see lib/quotation-pricing), so we must not bake them into the design amount
 * — that would double-tax. area_sqft is per-unit area * quantity.
 */
export function framePersistedPricing(
  doc: FrameDocument,
  config: PricingConfig = DEFAULT_PRICING
): { areaSqft: number; ratePerSqft: number; amount: number } {
  const p = priceFrame(doc, config)
  const quantity = Math.max(1, doc.details.quantity || 1)
  // Pre-tax base per unit = subtotal (glass + accessories).
  const preTaxRate = p.areaSqft > 0 ? Math.round(p.subtotal / p.areaSqft) : 0
  return {
    areaSqft: round2(p.areaSqft * quantity),
    ratePerSqft: preTaxRate,
    amount: p.subtotal * quantity,
  }
}
