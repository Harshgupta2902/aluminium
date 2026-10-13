import jsPDF from 'jspdf'
import { formatCurrency, formatDate } from './utils'
import {
  computeShapeGeometry,
  type DesignDocument,
  type WindowShape,
} from './design-editor/model'
import {
  isFrameDocument,
  type FrameDocument,
  type FrameSection,
} from './design-editor/frame-model'

/** A design as needed by the PDF proposal. */
export interface QuotationPDFDesign {
  name: string
  color?: string | null
  glass_type?: string | null
  area_sqft: number
  rate_per_sqft: number
  amount: number
  editor_document: DesignDocument | FrameDocument | null
}

export interface QuotationPDFData {
  quotation_number: string
  client_name: string
  client_email?: string
  client_phone: string
  created_at: string
  valid_until?: string
  designs: QuotationPDFDesign[]
  total_area?: number
  total_amount: number
  notes?: string
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
}

// A4 in jsPDF default units (mm).
const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2

const BRAND: [number, number, number] = [41, 128, 185]

export function generateQuotationPDF(data: QuotationPDFData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  drawHeader(doc, data)
  let y = 56

  // Client + quotation meta block.
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)
  doc.text('PROPOSAL FOR', MARGIN, y)
  doc.text('QUOTATION', PAGE_W - MARGIN, y, { align: 'right' })
  y += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(70, 70, 70)
  doc.text(data.client_name, MARGIN, y)
  doc.text(`No: ${data.quotation_number}`, PAGE_W - MARGIN, y, { align: 'right' })
  y += 5
  doc.text(`Phone: ${data.client_phone}`, MARGIN, y)
  doc.text(`Date: ${formatDate(data.created_at)}`, PAGE_W - MARGIN, y, {
    align: 'right',
  })
  y += 5
  if (data.client_email) {
    doc.text(`Email: ${data.client_email}`, MARGIN, y)
  }
  if (data.valid_until) {
    doc.text(`Valid Until: ${formatDate(data.valid_until)}`, PAGE_W - MARGIN, y, {
      align: 'right',
    })
  }
  y += 8

  // Divider.
  doc.setDrawColor(...BRAND)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 8

  // One block per design.
  data.designs.forEach((design, index) => {
    const blockHeight = 72
    if (y + blockHeight > PAGE_H - 20) {
      doc.addPage()
      y = MARGIN + 5
    }
    y = drawDesignBlock(doc, design, index, y)
    y += 6
  })

  // Totals.
  if (y + 30 > PAGE_H - 20) {
    doc.addPage()
    y = MARGIN + 5
  }
  y += 2
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(70, 70, 70)
  if (typeof data.total_area === 'number') {
    doc.text(
      `Total Area: ${data.total_area.toFixed(2)} Sqft`,
      MARGIN,
      y
    )
  }
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND)
  doc.text('GRAND TOTAL', PAGE_W - MARGIN - 55, y)
  doc.text(formatCurrency(data.total_amount), PAGE_W - MARGIN, y, {
    align: 'right',
  })
  y += 10

  // Notes.
  if (data.notes) {
    if (y + 20 > PAGE_H - 20) {
      doc.addPage()
      y = MARGIN + 5
    }
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Notes', MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(70, 70, 70)
    const lines = doc.splitTextToSize(data.notes, CONTENT_W)
    doc.text(lines, MARGIN, y)
  }

  drawFooters(doc, data)
  return doc
}

function drawHeader(doc: jsPDF, data: QuotationPDFData) {
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, PAGE_W, 32, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(data.company_name || 'Soft Window', MARGIN, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  let hy = 22
  if (data.company_address) {
    doc.text(data.company_address, MARGIN, hy)
    hy += 4.5
  }
  const contact = [
    data.company_phone ? `Phone: ${data.company_phone}` : null,
    data.company_email ? `Email: ${data.company_email}` : null,
  ]
    .filter(Boolean)
    .join('   ')
  if (contact) doc.text(contact, MARGIN, hy)
}

/** Draw one design: a window drawing on the left, details + amount on right. */
function drawDesignBlock(
  doc: jsPDF,
  design: QuotationPDFDesign,
  index: number,
  top: number
): number {
  const boxH = 66
  // Card background.
  doc.setDrawColor(225, 225, 225)
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(MARGIN, top, CONTENT_W, boxH, 2, 2, 'FD')

  // Title bar.
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)
  doc.text(
    `${index + 1}. ${design.name || 'Design'}`,
    MARGIN + 4,
    top + 7
  )

  // Window drawing area (left).
  const drawX = MARGIN + 4
  const drawY = top + 11
  const drawW = 70
  const drawH = boxH - 15
  drawDesignGeometry(doc, design.editor_document, drawX, drawY, drawW, drawH)

  // Details (right).
  const detailX = MARGIN + 82
  let dy = top + 15
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(70, 70, 70)

  const rows: [string, string][] = [
    ['Area', `${Number(design.area_sqft).toFixed(2)} Sqft`],
    ['Rate / Sqft', formatCurrency(design.rate_per_sqft)],
    ['Glass', design.glass_type || '—'],
    ['Colour', design.color || '—'],
  ]
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(130, 130, 130)
    doc.text(label, detailX, dy)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text(String(value), detailX + 32, dy)
    dy += 6
  }

  // Amount.
  dy += 2
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND)
  doc.text('Amount', detailX, dy)
  doc.text(formatCurrency(design.amount), PAGE_W - MARGIN - 4, dy, {
    align: 'right',
  })

  return top + boxH
}

/**
 * Render a design's window shapes into a jsPDF box using the same geometry the
 * on-screen canvas uses, scaled to fit (x, y, w, h) in mm.
 */
function drawDesignGeometry(
  doc: jsPDF,
  document: DesignDocument | FrameDocument | null,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (isFrameDocument(document)) {
    drawFrameGeometry(doc, document, x, y, w, h)
    return
  }
  const shapes = (document as DesignDocument | null)?.shapes ?? []
  if (shapes.length === 0) {
    doc.setFontSize(8)
    doc.setTextColor(170, 170, 170)
    doc.text('No drawing', x + w / 2, y + h / 2, { align: 'center' })
    return
  }

  const bounds = computeBounds(shapes)
  const contentW = Math.max(1, bounds.maxX - bounds.minX)
  const contentH = Math.max(1, bounds.maxY - bounds.minY)
  const scale = Math.min(w / contentW, h / contentH) * 0.92
  const offX = x + (w - contentW * scale) / 2
  const offY = y + (h - contentH * scale) / 2

  const px = (mm: number, axis: 'x' | 'y') =>
    (axis === 'x' ? offX : offY) +
    (mm - (axis === 'x' ? bounds.minX : bounds.minY)) * scale

  for (const shape of shapes) {
    const geo = computeShapeGeometry(shape)
    // Outer frame.
    doc.setDrawColor(90, 90, 90)
    doc.setLineWidth(0.4)
    doc.rect(
      px(geo.outer.x, 'x'),
      px(geo.outer.y, 'y'),
      geo.outer.width * scale,
      geo.outer.height * scale
    )
    // Panels.
    doc.setDrawColor(140, 140, 140)
    doc.setLineWidth(0.2)
    doc.setFillColor(225, 240, 233)
    for (const panel of geo.panels) {
      doc.rect(
        px(panel.rect.x, 'x'),
        px(panel.rect.y, 'y'),
        panel.rect.width * scale,
        panel.rect.height * scale,
        'FD'
      )
    }
  }
}

function computeBounds(shapes: WindowShape[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of shapes) {
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + s.width)
    maxY = Math.max(maxY, s.y + s.height)
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 }
  return { minX, minY, maxX, maxY }
}

/** Draw a section-based frame document into a jsPDF box. */
function drawFrameGeometry(
  doc: jsPDF,
  frame: FrameDocument,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.min(w / frame.width, h / frame.height) * 0.92
  const fw = frame.width * scale
  const fh = frame.height * scale
  const offX = x + (w - fw) / 2
  const offY = y + (h - fh) / 2
  const px = (mm: number, axis: 'x' | 'y') =>
    (axis === 'x' ? offX : offY) + mm * scale

  // Frame band.
  doc.setDrawColor(100, 116, 139)
  doc.setLineWidth(0.6)
  doc.setFillColor(241, 245, 249)
  doc.rect(offX, offY, fw, fh, 'FD')

  for (const sec of frame.sections) {
    drawFrameSection(doc, sec, px, scale)
  }

  // Dividers.
  for (const d of frame.dividers) {
    doc.setFillColor(d.kind === 'coupler' ? 100 : 148, d.kind === 'coupler' ? 116 : 163, d.kind === 'coupler' ? 139 : 184)
    doc.rect(px(d.cx, 'x'), px(d.cy, 'y'), d.cw * scale, d.ch * scale, 'F')
  }
}

function drawFrameSection(
  doc: jsPDF,
  sec: FrameSection,
  px: (mm: number, axis: 'x' | 'y') => number,
  scale: number
) {
  const x = px(sec.sx, 'x')
  const y = px(sec.sy, 'y')
  const w = sec.sw * scale
  const h = sec.sh * scale
  const type = sec.window?.type

  // Glass base.
  doc.setDrawColor(147, 197, 253)
  doc.setLineWidth(0.3)
  doc.setFillColor(219, 234, 254)
  doc.rect(x, y, w, h, 'FD')
  if (!type) return

  doc.setDrawColor(107, 114, 128)
  doc.setLineWidth(0.3)

  const line = (x1: number, y1: number, x2: number, y2: number) => doc.line(x1, y1, x2, y2)

  switch (type) {
    case 'sliding': {
      const panels = Number(sec.window!.props.panels) || 2
      const pw = w / panels
      for (let i = 1; i < panels; i++) line(x + pw * i, y, x + pw * i, y + h)
      break
    }
    case 'casement':
    case 'fixed-casement': {
      line(x, y, x + w, y + h / 2)
      line(x, y + h, x + w, y + h / 2)
      break
    }
    case 'double-casement': {
      const hw = w / 2
      line(x, y, x + hw, y + h / 2)
      line(x, y + h, x + hw, y + h / 2)
      line(x + w, y, x + hw, y + h / 2)
      line(x + w, y + h, x + hw, y + h / 2)
      break
    }
    case 'tophung':
    case 'awning': {
      line(x, y, x + w / 2, y + h)
      line(x + w, y, x + w / 2, y + h)
      break
    }
    case 'louvered':
    case 'roller-shutter':
    case 'roller-blind': {
      const n = Number(sec.window!.props.blades || sec.window!.props.slatCount) || 8
      for (let i = 1; i < n; i++) line(x, y + (h / n) * i, x + w, y + (h / n) * i)
      break
    }
    case 'door-single':
    case 'door-double': {
      const leaves = type === 'door-double' ? 2 : 1
      const lw = w / leaves
      for (let k = 0; k < leaves; k++) {
        const lx = x + lw * k
        doc.rect(lx + 2, y + 2, lw - 4, h - 4)
      }
      break
    }
    case 'ventilator':
    case 'glass-block': {
      const rows = Number(sec.window!.props.rows) || 2
      const cols = Number(sec.window!.props.cols) || 4
      for (let i = 1; i < cols; i++) line(x + (w / cols) * i, y, x + (w / cols) * i, y + h)
      for (let j = 1; j < rows; j++) line(x, y + (h / rows) * j, x + w, y + (h / rows) * j)
      break
    }
    case 'exhaust-fan':
    case 'exhaust-fan-rect': {
      const cx = x + w / 2
      const cy = y + h / 2
      const r = Math.min(w, h) / 2 - 1
      doc.circle(cx, cy, r)
      break
    }
    case 'grille':
    case 'georgian-bars': {
      const gx = Number(sec.window!.props.gridDivX) || 3
      const gy = Number(sec.window!.props.gridDivY) || 2
      for (let i = 1; i < gx; i++) line(x + (w / gx) * i, y, x + (w / gx) * i, y + h)
      for (let j = 1; j < gy; j++) line(x, y + (h / gy) * j, x + w, y + (h / gy) * j)
      break
    }
    default:
      break
  }
}

function drawFooters(doc: jsPDF, data: QuotationPDFData) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 220, 220)
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      data.company_name || 'Soft Window',
      MARGIN,
      PAGE_H - 9
    )
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 9, {
      align: 'right',
    })
    doc.text('Thank you for your business!', PAGE_W / 2, PAGE_H - 9, {
      align: 'center',
    })
  }
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
