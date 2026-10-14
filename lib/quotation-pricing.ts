/**
 * Quotation-level pricing.
 *
 * Design amounts (window_designs.amount) are PRE-TAX bases (glass + accessories,
 * no GST/install). This module applies the quotation's overheads once:
 *
 *   base          = Σ design.amount
 *   installation  = installation_charge  × total area (Rs/Sqft)
 *   labour        = labour_charge         × total area (Rs/Sqft)
 *   profit        = profit_percentage     × base
 *   wastage       = (profile_wastage% + glass_wastage%) × base
 *   custom heads  = Σ cost_heads.amount
 *   transport     = transport_charge (flat)
 *   ---------------------------------------------------------------
 *   preDiscount   = base + installation + labour + profit + wastage
 *                   + custom heads + transport
 *   discount      = percentage of preDiscount, or a flat amount
 *   subtotal      = preDiscount − discount
 *   tax           = CGST + SGST, or IGST, on subtotal (gst_mode)
 *   grandTotal    = subtotal + tax
 */

export interface QuotationOverheads {
  profit_percentage: number
  installation_charge: number
  labour_charge: number
  profile_wastage: number
  glass_wastage: number
  transport_charge: number
  discount: number
  discount_type: 'percentage' | 'fixed'
  cgst: number
  sgst: number
  igst: number
  gst_mode: 'cgst_sgst' | 'igst' | 'none'
}

export interface QuotationCostHead {
  label: string
  amount: number
}

export const DEFAULT_OVERHEADS: QuotationOverheads = {
  profit_percentage: 0,
  installation_charge: 0,
  labour_charge: 0,
  profile_wastage: 0,
  glass_wastage: 0,
  transport_charge: 0,
  discount: 0,
  discount_type: 'percentage',
  cgst: 9,
  sgst: 9,
  igst: 0,
  gst_mode: 'cgst_sgst',
}

export interface QuotationPriceBreakdown {
  base: number
  installation: number
  labour: number
  profit: number
  wastage: number
  customHeads: number
  transport: number
  preDiscount: number
  discountAmount: number
  subtotal: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  taxTotal: number
  grandTotal: number
  totalArea: number
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function computeQuotationPrice(
  designs: { area_sqft: number; amount: number }[],
  overheads: Partial<QuotationOverheads> | null | undefined,
  costHeads: QuotationCostHead[] = []
): QuotationPriceBreakdown {
  const o = { ...DEFAULT_OVERHEADS, ...(overheads ?? {}) }

  const base = Math.round(designs.reduce((s, d) => s + num(d.amount), 0))
  const totalArea = round2(designs.reduce((s, d) => s + num(d.area_sqft), 0))

  const installation = Math.round(num(o.installation_charge) * totalArea)
  const labour = Math.round(num(o.labour_charge) * totalArea)
  const profit = Math.round((base * num(o.profit_percentage)) / 100)
  const wastage = Math.round(
    (base * (num(o.profile_wastage) + num(o.glass_wastage))) / 100
  )
  const customHeads = Math.round(costHeads.reduce((s, c) => s + num(c.amount), 0))
  const transport = Math.round(num(o.transport_charge))

  const preDiscount = base + installation + labour + profit + wastage + customHeads + transport

  const discountAmount =
    o.discount_type === 'fixed'
      ? Math.round(num(o.discount))
      : Math.round((preDiscount * num(o.discount)) / 100)

  const subtotal = Math.max(0, preDiscount - discountAmount)

  let cgstAmount = 0
  let sgstAmount = 0
  let igstAmount = 0
  if (o.gst_mode === 'cgst_sgst') {
    cgstAmount = Math.round((subtotal * num(o.cgst)) / 100)
    sgstAmount = Math.round((subtotal * num(o.sgst)) / 100)
  } else if (o.gst_mode === 'igst') {
    igstAmount = Math.round((subtotal * num(o.igst)) / 100)
  }
  const taxTotal = cgstAmount + sgstAmount + igstAmount
  const grandTotal = subtotal + taxTotal

  return {
    base,
    installation,
    labour,
    profit,
    wastage,
    customHeads,
    transport,
    preDiscount,
    discountAmount,
    subtotal,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxTotal,
    grandTotal,
    totalArea,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
