'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2 } from 'lucide-react'
import { sendQuotationEmailAction } from '@/app/(dashboard)/dashboard/quotations/actions'

interface SendEmailButtonProps {
  quotation: {
    id: string
    quotation_number: string
    client_name: string
    client_email?: string | null
  }
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function SendEmailButton({
  quotation,
  variant = 'default',
  size = 'default',
}: SendEmailButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    const hasEmail = Boolean(quotation.client_email?.trim())
    const to = hasEmail
      ? quotation.client_email!.trim()
      : window.prompt('Client email to send this quotation to:')?.trim()
    if (!to) return

    setLoading(true)
    try {
      const res = await sendQuotationEmailAction(quotation.id, to)
      alert(res.message)
    } catch {
      alert('Failed to send email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleSend} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
      {loading ? 'Sending…' : 'Send via Email'}
    </Button>
  )
}
