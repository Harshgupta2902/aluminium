'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { downloadQuotationPDF, type QuotationPDFDesign } from '@/lib/pdf-generator'
import { createClient } from '@/lib/supabase/client'
import { computeQuotationPrice, type QuotationOverheads } from '@/lib/quotation-pricing'
import { logPdfGenerated } from '@/app/(auth)/audit-actions'

interface QuotationData {
  id: string
  quotation_number: string
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  created_at: string
  valid_until?: string | null
  total_amount: number
  notes?: string | null
  // Overhead columns (present on full-row selects).
  [key: string]: unknown
}

interface DownloadPDFButtonProps {
  quotation: QuotationData
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  iconOnly?: boolean
}

export function DownloadPDFButton({
  quotation,
  variant = 'outline',
  size = 'default',
  iconOnly = false,
}: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleDownload = async () => {
    setLoading(true)
    try {
      // Pull the quotation's designs for the proposal.
      const { data: designRows } = await supabase
        .from('window_designs')
        .select('name, color, glass_type, area_sqft, rate_per_sqft, amount, editor_document')
        .eq('quotation_id', quotation.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      const designs = (designRows ?? []) as QuotationPDFDesign[]

      // Load custom cost heads, then compute the full quotation-level price.
      const { data: headRows } = await supabase
        .from('quotation_cost_heads')
        .select('label, amount')
        .eq('quotation_id', quotation.id)
        .order('sort_order', { ascending: true })

      const price = computeQuotationPrice(
        designs.map((d) => ({ area_sqft: Number(d.area_sqft) || 0, amount: Number(d.amount) || 0 })),
        quotation as Partial<QuotationOverheads>,
        headRows ?? []
      )

      downloadQuotationPDF({
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
        company_address: 'Your Company Address',
        company_phone: '879475061, 8826619980',
        company_email: 'info@softwindow.com',
      })
      void logPdfGenerated(quotation.id, quotation.quotation_number)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  if (iconOnly) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={loading}
        title="Download PDF"
        className="h-8 w-8 p-0"
      >
        <Download className="h-4 w-4" />
        <span className="sr-only">
          {loading ? 'Generating...' : 'Download PDF'}
        </span>
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading}
    >
      <Download className="w-4 h-4 mr-2" />
      {loading ? 'Generating...' : 'Download PDF'}
    </Button>
  )
}
