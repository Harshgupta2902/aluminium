'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { downloadQuotationPDF } from '@/lib/pdf-generator'

interface QuotationData {
  quotation_number: string
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  created_at: string
  valid_until?: string | null
  items?: unknown[]
  total_amount: number
  notes?: string | null
}

interface DownloadPDFButtonProps {
  quotation: QuotationData
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  iconOnly?: boolean
}

export function DownloadPDFButton({ quotation, variant = 'outline', size = 'default', iconOnly = false }: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = () => {
    setLoading(true)
    try {
      downloadQuotationPDF({
        quotation_number: quotation.quotation_number,
        client_name: quotation.client_name,
        client_email: quotation.client_email ?? undefined,
        client_phone: quotation.client_phone ?? '',
        created_at: quotation.created_at,
        valid_until: quotation.valid_until ?? undefined,
        items: quotation.items || [],
        total_amount: quotation.total_amount,
        notes: quotation.notes ?? undefined,
        company_name: 'Soft Window',
        company_address: 'Your Company Address',
        company_phone: '879475061, 8826619980',
        company_email: 'info@softwindow.com',
      })
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
        <span className="sr-only">{loading ? 'Generating...' : 'Download PDF'}</span>
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
