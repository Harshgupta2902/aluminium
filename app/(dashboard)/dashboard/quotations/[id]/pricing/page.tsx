import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuotationPricing } from '@/components/quotations/quotation-pricing'
import { DEFAULT_OVERHEADS, type QuotationOverheads } from '@/lib/quotation-pricing'

export const metadata = { title: 'Pricing · Quotation' }

export default async function QuotationPricingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quotation, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !quotation) notFound()

  const { data: designRows } = await supabase
    .from('window_designs')
    .select('area_sqft, amount')
    .eq('quotation_id', id)

  const { data: headRows } = await supabase
    .from('quotation_cost_heads')
    .select('id, label, amount, sort_order')
    .eq('quotation_id', id)
    .order('sort_order', { ascending: true })

  const q = quotation as Record<string, unknown>
  const overheads: QuotationOverheads = {
    profit_percentage: Number(q.profit_percentage ?? DEFAULT_OVERHEADS.profit_percentage),
    installation_charge: Number(q.installation_charge ?? DEFAULT_OVERHEADS.installation_charge),
    labour_charge: Number(q.labour_charge ?? DEFAULT_OVERHEADS.labour_charge),
    profile_wastage: Number(q.profile_wastage ?? DEFAULT_OVERHEADS.profile_wastage),
    glass_wastage: Number(q.glass_wastage ?? DEFAULT_OVERHEADS.glass_wastage),
    transport_charge: Number(q.transport_charge ?? DEFAULT_OVERHEADS.transport_charge),
    discount: Number(q.discount ?? DEFAULT_OVERHEADS.discount),
    discount_type: (q.discount_type as 'percentage' | 'fixed') ?? DEFAULT_OVERHEADS.discount_type,
    cgst: Number(q.cgst ?? DEFAULT_OVERHEADS.cgst),
    sgst: Number(q.sgst ?? DEFAULT_OVERHEADS.sgst),
    igst: Number(q.igst ?? DEFAULT_OVERHEADS.igst),
    gst_mode: (q.gst_mode as QuotationOverheads['gst_mode']) ?? DEFAULT_OVERHEADS.gst_mode,
  }

  return (
    <QuotationPricing
      quotationId={id}
      designs={(designRows ?? []).map((d) => ({
        area_sqft: Number(d.area_sqft) || 0,
        amount: Number(d.amount) || 0,
      }))}
      initialOverheads={overheads}
      initialCostHeads={(headRows ?? []).map((h) => ({
        id: String(h.id),
        label: String(h.label ?? ''),
        amount: Number(h.amount) || 0,
      }))}
    />
  )
}
