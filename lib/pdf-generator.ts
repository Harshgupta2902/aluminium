import jsPDF from 'jspdf'
import { formatCurrency, formatDate } from './utils'

export interface QuotationPDFData {
  quotation_number: string
  client_name: string
  client_email?: string
  client_phone: string
  created_at: string
  valid_until?: string
  items: any[]
  total_amount: number
  notes?: string
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
}

export function generateQuotationPDF(data: QuotationPDFData) {
  const doc = new jsPDF()
  let yPos = 20

  // Company Header
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(data.company_name || 'Soft Window', 20, yPos)
  
  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (data.company_address) {
    doc.text(data.company_address, 20, yPos)
    yPos += 5
  }
  if (data.company_phone || data.company_email) {
    const contactInfo = []
    if (data.company_phone) contactInfo.push(`Phone: ${data.company_phone}`)
    if (data.company_email) contactInfo.push(`Email: ${data.company_email}`)
    doc.text(contactInfo.join(' | '), 20, yPos)
    yPos += 10
  }

  // Quotation Title
  yPos += 5
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('QUOTATION', 20, yPos)
  
  // Quotation Number (right aligned)
  doc.setFontSize(12)
  doc.text(data.quotation_number, 190, yPos, { align: 'right' })

  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${formatDate(data.created_at)}`, 20, yPos)
  if (data.valid_until) {
    doc.text(`Valid Until: ${formatDate(data.valid_until)}`, 190, yPos, { align: 'right' })
  }

  yPos += 15
  
  // Client Information
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO:', 20, yPos)
  yPos += 7
  doc.setFont('helvetica', 'normal')
  doc.text(data.client_name, 20, yPos)
  yPos += 5
  doc.text(`Phone: ${data.client_phone}`, 20, yPos)
  if (data.client_email) {
    yPos += 5
    doc.text(`Email: ${data.client_email}`, 20, yPos)
  }

  yPos += 15

  // Table Header
  doc.setFillColor(41, 128, 185)
  doc.rect(20, yPos - 5, 170, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('Description', 22, yPos + 1)
  doc.text('Dimensions', 90, yPos + 1)
  doc.text('Qty', 135, yPos + 1)
  doc.text('Amount', 170, yPos + 1, { align: 'right' })

  yPos += 10
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')

  // Line Items
  data.items.forEach((item, index) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    const description = `${item.window_type.charAt(0).toUpperCase() + item.window_type.slice(1)} Window - ${item.profile_type.toUpperCase()}`
    const dimensions = `${item.dimensions.width} × ${item.dimensions.height}mm`
    const qty = item.quantity.toString()
    const amount = formatCurrency(item.total_cost)

    doc.text(description, 22, yPos)
    doc.text(dimensions, 90, yPos)
    doc.text(qty, 135, yPos)
    doc.text(amount, 188, yPos, { align: 'right' })

    yPos += 7

    // Item details (smaller font)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    const details = [
      `Glass: ${item.glass_type}`,
      `Color: ${item.color}`,
      `Profile: ${formatCurrency(item.profile_cost)}`,
      `Glass: ${formatCurrency(item.glass_cost)}`,
      `Labour: ${formatCurrency(item.labour_cost)}`,
    ]
    doc.text(details.join(' | '), 22, yPos)
    yPos += 5
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)

    // Separator line
    doc.setDrawColor(200, 200, 200)
    doc.line(20, yPos, 190, yPos)
    yPos += 7
  })

  // Total
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('TOTAL:', 135, yPos)
  doc.text(formatCurrency(data.total_amount), 188, yPos, { align: 'right' })

  // Notes
  if (data.notes) {
    yPos += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 20, yPos)
    yPos += 7
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(data.notes, 170)
    doc.text(splitNotes, 20, yPos)
    yPos += splitNotes.length * 5
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
    doc.text(
      'Thank you for your business!',
      105,
      285,
      { align: 'center' }
    )
  }

  return doc
}

export function downloadQuotationPDF(data: QuotationPDFData) {
  const doc = generateQuotationPDF(data)
  doc.save(`${data.quotation_number}.pdf`)
}

export function getQuotationPDFBlob(data: QuotationPDFData): Blob {
  const doc = generateQuotationPDF(data)
  return doc.output('blob')
}

export function getQuotationPDFBase64(data: QuotationPDFData): string {
  const doc = generateQuotationPDF(data)
  return doc.output('datauristring')
}
