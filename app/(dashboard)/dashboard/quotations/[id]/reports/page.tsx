import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuotationReports } from '@/components/quotations/quotation-reports'
import type { ReportData, ReportDesign } from '@/lib/reports-generator'

export const metadata = { title: 'Reports · Quotation' }

export default async function QuotationReportsPage({
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
    .select('name, color, glass_type, area_sqft, rate_per_sqft, amount, width, height, window_type, editor_document')
    .eq('quotation_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const designs: ReportDesign[] = (designRows ?? []).map((d) => {
    const doc = d.editor_document as { details?: { location?: string } } | null
    return {
      name: String(d.name ?? ''),
      color: d.color ?? null,
      glass_type: d.glass_type ?? null,
      area_sqft: Number(d.area_sqft) || 0,
      rate_per_sqft: Number(d.rate_per_sqft) || 0,
      amount: Number(d.amount) || 0,
      width: Number(d.width) || null,
      height: Number(d.height) || null,
      window_type: d.window_type ?? null,
      location: doc?.details?.location ?? null,
      editor_document: d.editor_document ?? null,
    }
  })

  const data: ReportData = {
    quotation_number: quotation.quotation_number,
    client_name: quotation.client_name,
    client_phone: quotation.client_phone,
    created_at: quotation.created_at,
    designs,
    company_name: 'Soft Window',
    company_phone: '879475061, 8826619980',
    company_email: 'info@softwindow.com',
  }

  return <QuotationReports data={data} />
}
