'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { sendQuotationViaWhatsApp, createWhatsAppLink } from '@/lib/whatsapp'

interface SendWhatsAppButtonProps {
  quotation: {
    quotation_number: string
    client_name: string
    client_phone: string
    total_amount: number
    [key: string]: unknown
  }
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function SendWhatsAppButton({ quotation, variant = 'default', size = 'default' }: SendWhatsAppButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    setLoading(true)
    try {
      const result = await sendQuotationViaWhatsApp({
        phoneNumber: quotation.client_phone,
        quotation,
      })

      if (result.success) {
        // For now, open WhatsApp web with a link since API may not be configured
        const message = `Hi ${quotation.client_name}, your quotation ${quotation.quotation_number} is ready! Total: ₹${quotation.total_amount.toLocaleString('en-IN')}. Please check your email or contact us for the full quotation.`
        const whatsappLink = createWhatsAppLink(quotation.client_phone, message)
        window.open(whatsappLink, '_blank')
        
        alert('Opening WhatsApp... Note: Configure WhatsApp Business API in .env.local for direct PDF sending.')
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('WhatsApp send failed:', error)
      alert('Failed to send via WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSend}
      disabled={loading}
    >
      <Send className="w-4 h-4 mr-2" />
      {loading ? 'Sending...' : 'Send via WhatsApp'}
    </Button>
  )
}
