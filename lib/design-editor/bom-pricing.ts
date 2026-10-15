/**
 * Weight-based Bill-of-Materials (BOM) pricing engine.
 *
 * Replaces the area × type-rate estimate with a real fabrication model that
 * mirrors how aluminium windows are actually costed:
 *
 *   aluminium = Σ (cut_length_m × weight_per_meter_kg) × aluminium_rate(₹/kg)
 *   coating   = total_weight_kg × coating_rate(₹/kg)
 *   glass     = glass_area_sqft × glass_rate(₹/sqft)
 *   hardware  = Σ selected accessory piece prices
 *   labour    = area_sqft × labour_charge(₹/sqft)
 *   consumables = per-piece heads (corner cleats, screws, …) × counts
 *   subtotal  = all of the above
 *   profit    = subtotal × profit_percentage
 *   total     = subtotal + profit
 *
 * All lengths are computed from the window geometry (perimeter, sashes,
 * interlocks) adjusted by the overlap settings. Weight-per-meter comes from the
 * selected series' profiles (series_profiles.weight_per_meter), falling back to
 * industry-standard group defaults when a profile isn't resolved.
 *
 * The engine is PURE: callers pass resolved inputs (cost settings, a
 * group→weight map, glass rate). GST/installation are NOT applied here — those
 * belong at the quotation level (see lib/quotation-pricing.ts).
 */

import { calculateGlassArea } from '@/lib/calculations'
import type { FrameDocument, FrameSection, WindowTypeId } from './frame-model'

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

/** Cost heads from `aluminium_cost_settings` (per user). */
export interface CostSettings {
  aluminium_rate: number // ₹/kg
  profit_percentage: number // %
  labour_charge: number // ₹/sqft
  coating: number // ₹/kg
  coating_selected?: boolean // whether coating is charged (per-kg) — default true
  corner_cleat: number // ₹/piece
  weather_strip: number // ₹/m
  ss_corner_con: number // ₹/piece
  screw: number // ₹/piece
  rail: number // ₹/m
  fastner: number // ₹/piece
  // Overlaps (mm) — adjust cut sizes.
  slider_width_overlap: number
  slider_height_overlap: number
  slider_glass_overlap: number
  slim_width_overlap: number
  casement_width_overlap: number
  casement_height_overlap: number
  casement_glass_overlap: number
}

export const DEFAULT_COST_SETTINGS: CostSettings = {
  aluminium_rate: 500,
  profit_percentage: 0,
  labour_charge: 40,
  coating: 2,
  coating_selected: true,
  corner_cleat: 30,
  weather_strip: 50,
  ss_corner_con: 50,
  screw: 2,
  rail: 100,
  fastner: 5,
  slider_width_overlap: 25,
  slider_height_overlap: 18,
  slider_glass_overlap: 16,
  slim_width_overlap: 25,
  casement_width_overlap: 12,
  casement_height_overlap: 12,
  casement_glass_overlap: 20,
}

/** Weight per metre (kg/m) by profile group — industry-standard fallbacks. */
export const DEFAULT_GROUP_WEIGHT: Record<string, number> = {
  track: 1.0,
  sash: 0.75,
  mesh_sash: 0.55,
  interlock: 0.6,
  slim_interlock: 0.45,
  slim_huricane: 0.5,
  mullion: 1.1,
  clip: 0.3,
  mesh_clip: 0.25,
  outer_top: 1.0,
  outer_left: 1.0,
  frame: 1.0, // outer frame uses the track weight by convention
}

/** Resolved pricing inputs the engine needs. */
export interface BomInputs {
  cost: CostSettings
  /** profile_group -> weight per metre (kg/m) for the selected series. */
  groupWeight: Record<string, number>
  /** Glass rate ₹/sqft for the selected glass type. */
  glassRate: number
}

export const DEFAULT_BOM_INPUTS: BomInputs = {
  cost: DEFAULT_COST_SETTINGS,
  groupWeight: DEFAULT_GROUP_WEIGHT,
  glassRate: 90,
}

/* ------------------------------------------------------------------ *
 * Outputs
 * ------------------------------------------------------------------ */

/** One profile line in the cut list (for transparency + the cutting list). */
export interface ProfileLine {
  group: string
  code?: string
  pieces: number
  lengthM: number // total cut length across all pieces (m)
  weightPerM: number // kg/m used
  weightKg: number // lengthM × weightPerM
}

export interface SectionBom {
  sectionId: number
  type: WindowTypeId | null
  label: string
  widthMm: number
  heightMm: number
  areaSqft: number
  profiles: ProfileLine[]
  weightKg: number
  aluminiumCost: number
  coatingCost: number
  glassCost: number
  hardwareCost: number
  consumablesCost: number
  labourCost: number
  /** Pre-profit subtotal for this section. */
  subtotal: number
}

export interface FrameBom {
  sections: SectionBom[]
  areaSqft: number
  weightKg: number
  aluminiumCost: number
  coatingCost: number
  glassCost: number
  hardwareCost: number
  consumablesCost: number
  labourCost: number
  /** Σ section subtotals (pre-profit, pre-tax). */
  subtotal: number
  profit: number
  /** subtotal + profit, per unit. */
  unitTotal: number
  quantity: number
  /** unitTotal × quantity. */
  total: number
  /** Blended ₹/sqft for display (unitTotal / area). */
  ratePerSqft: number
}

/* ------------------------------------------------------------------ *
 * Input resolution (from editor lists + selected series)
 * ------------------------------------------------------------------ */

interface SeriesLike {
  id: string
  profiles: { profile_group: string; weight_per_meter: number }[]
}
interface GlassLike {
  name: string
  rate: number
}

/**
 * Build `BomInputs` from the editor's loaded data:
 *  - cost settings (per user)
 *  - the selected series' profiles → a group→weight map (averaged per group)
 *  - the selected glass type → ₹/sqft
 * Falls back to industry defaults when a series/glass isn't resolved.
 */
export function resolveBomInputs(args: {
  cost?: Partial<CostSettings> | null
  series?: SeriesLike[] | null
  seriesId?: string | null
  glasses?: GlassLike[] | null
  glassType?: string | null
}): BomInputs {
  const cost: CostSettings = { ...DEFAULT_COST_SETTINGS, ...(args.cost ?? {}) }

  // Group → average weight-per-metre from the selected series' profiles.
  const groupWeight: Record<string, number> = { ...DEFAULT_GROUP_WEIGHT }
  const selected = args.series?.find((s) => s.id === args.seriesId)
  if (selected) {
    const acc = new Map<string, { sum: number; n: number }>()
    for (const p of selected.profiles) {
      const w = Number(p.weight_per_meter)
      if (!Number.isFinite(w) || w <= 0) continue
      const cur = acc.get(p.profile_group) ?? { sum: 0, n: 0 }
      cur.sum += w
      cur.n += 1
      acc.set(p.profile_group, cur)
    }
    for (const [g, { sum, n }] of acc) groupWeight[g] = sum / n
  }

  const glass = args.glasses?.find((g) => g.name === args.glassType)
  const glassRate = glass ? Number(glass.rate) || 0 : DEFAULT_BOM_INPUTS.glassRate

  return { cost, groupWeight, glassRate }
}

/* ------------------------------------------------------------------ *
 * Geometry → cut lengths
 * ------------------------------------------------------------------ */

const mm2m = (mm: number) => mm / 1000

/** Area of a rectangle in sq ft (shared mm→sqft helper). */
export function rectAreaSqft(widthMm: number, heightMm: number): number {
  return calculateGlassArea({ width: widthMm, height: heightMm })
}

/** Number of sliding panels on a section (defaults to 2 for sliding). */
function panelCount(section: FrameSection): number {
  const p = Number(section.window?.props?.panels)
  return Number.isFinite(p) && p > 0 ? p : section.window?.type === 'sliding' ? 2 : 1
}

/**
 * Build the profile cut-list for one section based on its window type.
 * Lengths are in metres, adjusted by the relevant overlaps.
 */
function sectionProfiles(
  section: FrameSection,
  inputs: BomInputs
): ProfileLine[] {
  const type = section.window?.type
  if (!type) return []
  const w = section.sw
  const h = section.sh
  const { cost, groupWeight } = inputs
  const weightOf = (g: string) => groupWeight[g] ?? DEFAULT_GROUP_WEIGHT[g] ?? 0.6

  const lines: ProfileLine[] = []
  const add = (group: string, pieces: number, lengthM: number) => {
    const wpm = weightOf(group)
    if (lengthM <= 0) return
    lines.push({
      group,
      pieces,
      lengthM: round3(lengthM),
      weightPerM: wpm,
      weightKg: round3(lengthM * wpm),
    })
  }

  // Outer frame perimeter (every window has one).
  const framePerimeterM = mm2m(2 * (w + h))
  add('track', 1, framePerimeterM)

  if (type === 'sliding') {
    const panels = panelCount(section)
    const slim = section.window?.props?.slimProfile === true
    const wOverlap = slim ? cost.slim_width_overlap : cost.slider_width_overlap
    const hOverlap = cost.slider_height_overlap
    const shutterW = w / panels
    // Each shutter sash: 2×(shutterW + h), adjusted by overlaps.
    const sashPerShutterM = mm2m(2 * (shutterW + wOverlap + (h - hOverlap)))
    add('sash', panels, sashPerShutterM * panels)
    // Interlocks between adjacent sliding panels (vertical).
    if (panels > 1) {
      const interlockGroup = slim ? 'slim_interlock' : 'interlock'
      add(interlockGroup, panels - 1, mm2m((h - hOverlap)) * (panels - 1))
    }
  } else if (
    type === 'casement' ||
    type === 'double-casement' ||
    type === 'fixed-casement' ||
    type === 'tophung' ||
    type === 'awning'
  ) {
    // Casement family: a sash leaf around the opening.
    const leaves = type === 'double-casement' ? 2 : 1
    const wOverlap = cost.casement_width_overlap
    const hOverlap = cost.casement_height_overlap
    const leafW = w / leaves
    const sashPerLeafM = mm2m(2 * ((leafW - wOverlap) + (h - hOverlap)))
    add('sash', leaves, sashPerLeafM * leaves)
    if (leaves > 1) add('mullion', 1, mm2m(h))
  } else if (type.startsWith('door')) {
    const leaves = type === 'door-double' ? 2 : 1
    const leafW = w / leaves
    add('sash', leaves, mm2m(2 * (leafW + h)) * leaves)
    if (leaves > 1) add('mullion', 1, mm2m(h))
  }
  // Fixed / special types: frame only (already added).

  return lines
}

/* ------------------------------------------------------------------ *
 * Hardware + consumables
 * ------------------------------------------------------------------ */

/** Sum per-item accessory prices on a section (section-level + per-panel). */
function sectionHardwareCost(section: FrameSection): number {
  const props = section.window?.props
  if (!props) return 0
  let sum = 0
  const addMap = (acc: unknown) => {
    if (!acc || typeof acc !== 'object') return
    for (const v of Object.values(acc as Record<string, { price?: number } | null>)) {
      const p = Number(v?.price)
      if (Number.isFinite(p) && p > 0) sum += p
    }
  }
  addMap(props.accessories)
  const panelAcc = props.panelAccessories
  if (Array.isArray(panelAcc)) for (const panel of panelAcc) addMap(panel)
  return sum
}

/**
 * Per-piece consumables for a section: corner cleats + screws scale with the
 * number of corners/joints; weather strip + rail scale with length. Kept simple
 * and transparent — refine with real counts as needed.
 */
function sectionConsumablesCost(section: FrameSection, cost: CostSettings): number {
  const type = section.window?.type
  if (!type) return 0
  const w = section.sw
  const h = section.sh
  const perimeterM = mm2m(2 * (w + h))

  // 4 frame corners always; sliding/casement add sash corners.
  const panels = panelCount(section)
  const corners = 4 + (type === 'sliding' ? panels * 4 : 0)
  const cleats = corners * cost.corner_cleat
  const screws = corners * 2 * cost.screw // ~2 screws per corner
  const weatherStrip = perimeterM * cost.weather_strip
  const rail = type === 'sliding' ? mm2m(w) * cost.rail : 0

  return cleats + screws + weatherStrip + rail
}

/* ------------------------------------------------------------------ *
 * Pricing
 * ------------------------------------------------------------------ */

function priceSection(section: FrameSection, inputs: BomInputs): SectionBom {
  const { cost } = inputs
  const type = section.window?.type ?? null
  const bandFactor = section.band === 'arc' ? Math.PI / 4 : 1
  const areaSqft = round2(rectAreaSqft(section.sw, section.sh) * bandFactor)

  if (!type) {
    return {
      sectionId: section.id,
      type: null,
      label: `S${section.idx}`,
      widthMm: Math.round(section.sw),
      heightMm: Math.round(section.sh),
      areaSqft,
      profiles: [],
      weightKg: 0,
      aluminiumCost: 0,
      coatingCost: 0,
      glassCost: 0,
      hardwareCost: 0,
      consumablesCost: 0,
      labourCost: 0,
      subtotal: 0,
    }
  }

  const profiles = sectionProfiles(section, inputs)
  const weightKg = round3(profiles.reduce((s, p) => s + p.weightKg, 0))

  const aluminiumCost = weightKg * cost.aluminium_rate
  const coatingCost = cost.coating_selected === false ? 0 : weightKg * cost.coating
  const glassCost = areaSqft * inputs.glassRate
  const hardwareCost = sectionHardwareCost(section)
  const consumablesCost = sectionConsumablesCost(section, cost)
  const labourCost = areaSqft * cost.labour_charge

  const subtotal =
    aluminiumCost + coatingCost + glassCost + hardwareCost + consumablesCost + labourCost

  return {
    sectionId: section.id,
    type,
    label: `S${section.idx}`,
    widthMm: Math.round(section.sw),
    heightMm: Math.round(section.sh),
    areaSqft,
    profiles,
    weightKg,
    aluminiumCost: Math.round(aluminiumCost),
    coatingCost: Math.round(coatingCost),
    glassCost: Math.round(glassCost),
    hardwareCost: Math.round(hardwareCost),
    consumablesCost: Math.round(consumablesCost),
    labourCost: Math.round(labourCost),
    subtotal: Math.round(subtotal),
  }
}

/** Price a whole frame document with the weight-based BOM engine. */
export function priceFrameBom(
  doc: FrameDocument,
  inputs: BomInputs = DEFAULT_BOM_INPUTS
): FrameBom {
  const sections = doc.sections.map((s) => priceSection(s, inputs))

  const sum = (f: (s: SectionBom) => number) => sections.reduce((a, s) => a + f(s), 0)
  const areaSqft = round2(sum((s) => s.areaSqft))
  const weightKg = round3(sum((s) => s.weightKg))
  const aluminiumCost = Math.round(sum((s) => s.aluminiumCost))
  const coatingCost = Math.round(sum((s) => s.coatingCost))
  const glassCost = Math.round(sum((s) => s.glassCost))
  const hardwareCost = Math.round(sum((s) => s.hardwareCost))
  const consumablesCost = Math.round(sum((s) => s.consumablesCost))
  const labourCost = Math.round(sum((s) => s.labourCost))
  const subtotal = Math.round(sum((s) => s.subtotal))
  const profit = Math.round((subtotal * (inputs.cost.profit_percentage || 0)) / 100)
  const unitTotal = subtotal + profit
  const quantity = Math.max(1, doc.details.quantity || 1)
  const total = unitTotal * quantity
  const ratePerSqft = areaSqft > 0 ? Math.round(unitTotal / areaSqft) : 0

  return {
    sections,
    areaSqft,
    weightKg,
    aluminiumCost,
    coatingCost,
    glassCost,
    hardwareCost,
    consumablesCost,
    labourCost,
    subtotal,
    profit,
    unitTotal,
    quantity,
    total,
    ratePerSqft,
  }
}

/**
 * Persistence contract for window_designs (parallels framePersistedPricing).
 * `amount` is PRE-TAX (subtotal + profit) × quantity; GST/install are applied
 * once at the quotation level. Also returns the per-section BOM breakdown so
 * callers can persist a `panel_details`-style array.
 */
export function framePersistedBom(
  doc: FrameDocument,
  inputs: BomInputs = DEFAULT_BOM_INPUTS
): {
  areaSqft: number
  ratePerSqft: number
  amount: number
  weightKg: number
  breakdown: SectionBom[]
} {
  const p = priceFrameBom(doc, inputs)
  const quantity = Math.max(1, doc.details.quantity || 1)
  return {
    areaSqft: round2(p.areaSqft * quantity),
    ratePerSqft: p.ratePerSqft,
    amount: p.unitTotal * quantity,
    weightKg: round3(p.weightKg * quantity),
    breakdown: p.sections,
  }
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}
