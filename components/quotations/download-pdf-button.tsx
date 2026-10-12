'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { downloadQuotationPDF } from '@/lib/pdf-generator'

interface DownloadPDFButtonProps {
  quotation: any
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function DownloadPDFButton({ quotation, variant = 'outline', size = 'default' }: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = () => {
    setLoading(true)
    try {
      downloadQuotationPDF({
        quotation_number: quotation.quotation_number,
        client_name: quotation.client_name,
        client_email: quotation.client_email,
        client_phone: quotation.client_phone,
        created_at: quotation.created_at,
        valid_until: quotation.valid_until,
        items: quotation.items || [],
        total_amount: quotation.total_amount,
        notes: quotation.notes,
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
