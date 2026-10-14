'use server'

import { createClient } from '@/lib/supabase/server'
import { getQuotationUsage, type QuotationUsage } from '@/lib/access'

/**
 * Server-side quotation-limit check. The new-quotation page calls this before
 * creating its first draft so a user can't exceed the limit on their active
 * billing period (client-side counting could be bypassed; RLS also hides other
 * users' rows, so a client count would be wrong for the superadmin anyway).
 */
export async function getMyQuotationUsage(): Promise<QuotationUsage> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      limit: 0,
      used: 0,
      remaining: 0,
      unlimited: false,
      periodEnds: null,
      canCreate: false,
    }
  }
  return getQuotationUsage(supabase, user.id)
}

import { getQuotationPDFBase64, type QuotationPDFDesign } from '@/lib/pdf-generator'
import { sendQuotationEmail } from '@/lib/mailer'
import { computeQuotationPrice, type QuotationOverheads } from '@/lib/quotation-pricing'
import { formatCurrency } from '@/lib/utils'

/**
 * Email a quotation proposal (PDF attached) to its client, via nodemailer SMTP.
 * Builds the PDF server-side with the full quotation-level price breakdown.
 */
export async function sendQuotationEmailAction(
  quotationId: string,
  overrideEmail?: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'You must be logged in.' }

  const { data: quotation, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', quotationId)
    .single()
  if (error || !quotation) return { ok: false, message: 'Quotation not found.' }

  const to = (overrideEmail || quotation.client_email || '').trim()
  if (!to) return { ok: false, message: 'No client email on this quotation.' }

  const { data: designRows } = await supabase
    .from('window_designs')
    .select('name, color, glass_type, area_sqft, rate_per_sqft, amount, editor_document')
    .eq('quotation_id', quotationId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const { data: headRows } = await supabase
    .from('quotation_cost_heads')
    .select('label, amount')
    .eq('quotation_id', quotationId)
    .order('sort_order', { ascending: true })

  const designs = (designRows ?? []) as QuotationPDFDesign[]
  const price = computeQuotationPrice(
    designs.map((d) => ({ area_sqft: Number(d.area_sqft) || 0, amount: Number(d.amount) || 0 })),
    quotation as Partial<QuotationOverheads>,
    headRows ?? []
  )

  try {
    const pdfBase64 = getQuotationPDFBase64({
      quotation_number: quotation.quotation_number,
      client_name: quotation.client_name,
      client_email: quotation.client_email ?? undefined,
      client_phone: quotation.client_phone ?? '',
      created_at: quotation.created_at,
      valid_until: quotation.valid_until ?? undefined,
      designs,
      total_area: price.totalArea,
      total_amount: price.grandTotal || quotation.total_amount,
      pricing: {
        base: price.base,
        installation: price.installation,
        labour: price.labour,
        profit: price.profit,
        wastage: price.wastage,
        customHeads: price.customHeads,
        transport: price.transport,
        discount: price.discountAmount,
        subtotal: price.subtotal,
        cgst: price.cgstAmount,
        sgst: price.sgstAmount,
        igst: price.igstAmount,
        grandTotal: price.grandTotal,
      },
      notes: quotation.notes ?? undefined,
      company_name: 'Soft Window',
      company_phone: '879475061, 8826619980',
      company_email: 'info@softwindow.com',
    })

    await sendQuotationEmail({
      to,
      clientName: quotation.client_name,
      quotationNumber: quotation.quotation_number,
      grandTotal: formatCurrency(price.grandTotal || quotation.total_amount),
      pdfBase64,
    })

    return { ok: true, message: `Quotation emailed to ${to}` }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Failed to send email',
    }
  }
}
