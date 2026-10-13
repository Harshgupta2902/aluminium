/**
 * WhatsApp Integration for sending quotations
 * 
 * This module provides functionality to send quotation PDFs via WhatsApp.
 * You'll need to integrate with WhatsApp Business API or a service like Twilio.
 */

import { getQuotationPDFBase64 } from './pdf-generator'

export interface WhatsAppConfig {
  apiKey: string
  apiUrl: string
  fromNumber: string
}

export interface SendQuotationParams {
  phoneNumber: string
  quotation: any
  message?: string
}

/**
 * Send quotation PDF via WhatsApp
 * 
 * NOTE: This is a placeholder implementation.
 * You need to integrate with actual WhatsApp Business API:
 * - Official WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
 * - Twilio: https://www.twilio.com/docs/whatsapp
 * - Other providers: MessageBird, Infobip, etc.
 */
export async function sendQuotationViaWhatsApp(params: SendQuotationParams): Promise<{
  success: boolean
  message: string
  messageId?: string
}> {
  const { phoneNumber, quotation, message } = params

  try {
    // Get PDF as base64
    const pdfBase64 = getQuotationPDFBase64({
      quotation_number: quotation.quotation_number,
      client_name: quotation.client_name,
      client_email: quotation.client_email,
      client_phone: quotation.client_phone,
      created_at: quotation.created_at,
      valid_until: quotation.valid_until,
      designs: quotation.designs || [],
      total_amount: quotation.total_amount,
      notes: quotation.notes,
      company_name: 'Soft Window',
      company_address: 'Your Company Address',
      company_phone: '879475061, 8826619980',
      company_email: 'info@softwindow.com',
    })

    // Format phone number (remove special characters)
    const formattedPhone = phoneNumber.replace(/[^\d]/g, '')

    // Default message if not provided
    const whatsappMessage = message || `
Hi ${quotation.client_name},

Thank you for your interest! Please find attached your quotation ${quotation.quotation_number}.

Total Amount: ₹${quotation.total_amount.toLocaleString('en-IN')}

Please review and let us know if you have any questions.

Best regards,
Soft Window Team
    `.trim()

    // TODO: Integrate with your WhatsApp provider
    // Example with Twilio:
    /*
    const response = await fetch(`${process.env.WHATSAPP_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.WHATSAPP_FROM_NUMBER,
        to: `whatsapp:+${formattedPhone}`,
        body: whatsappMessage,
        mediaUrl: [pdfBase64]
      })
    })

    const data = await response.json()
    
    return {
      success: true,
      message: 'Quotation sent successfully via WhatsApp',
      messageId: data.sid
    }
    */

    // For now, return a simulated success response
    console.log('WhatsApp Integration - Would send to:', formattedPhone)
    console.log('Message:', whatsappMessage)
    console.log('PDF attached')

    return {
      success: true,
      message: 'WhatsApp integration ready - Configure API keys in .env.local',
      messageId: `sim_${Date.now()}`,
    }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send via WhatsApp',
    }
  }
}

/**
 * Validate phone number format for WhatsApp
 */
export function validateWhatsAppPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/[^\d]/g, '')
  
  // Check if it's a valid length (typically 10-15 digits)
  return cleaned.length >= 10 && cleaned.length <= 15
}

/**
 * Format phone number for WhatsApp (add country code if missing)
 */
export function formatWhatsAppPhone(phone: string, defaultCountryCode: string = '91'): string {
  const cleaned = phone.replace(/[^\d]/g, '')
  
  // If phone doesn't start with country code, add it
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`
  }
  
  return cleaned
}

/**
 * Create a WhatsApp link for manual sharing
 */
export function createWhatsAppLink(phoneNumber: string, message: string): string {
  const formatted = formatWhatsAppPhone(phoneNumber)
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${formatted}?text=${encoded}`
}
