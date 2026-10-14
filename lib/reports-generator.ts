import jsPDF from 'jspdf'
import { formatCurrency } from './utils'
import {
  PAGE_W,
  PAGE_H,
  MARGIN,
  CONTENT_W,
  BRAND,
  drawDesignGeometry,
  type QuotationPDFDesign,
} from './pdf-generator'
import { isFrameDocument, type FrameDocument } from './design-editor/frame-model'

/* ------------------------------------------------------------------ *
 * Shared report inputs + chrome
 * ------------------------------------------------------------------ */

export interface ReportDesign extends QuotationPDFDesign {
  location?: string | null
  width?: number | null
  height?: number | null
  window_type?: string | null
}

export interface ReportData {
  quotation_number: string
  client_name: string
  client_phone?: string | null
  created_at: string
  designs: ReportDesign[]
  company_name?: string
  company_phone?: string
  company_email?: string
}

export type ReportKind =
  | 'project-dimensions'
  | 'window-elevation'
  | 'typology'
  | 'accessories'

const REPORT_TITLES: Record<ReportKind, string> = {
  'project-dimensions': 'Project Dimension Report',
  'window-elevation': 'Window Elevation Report',
  typology: 'Typology Report',
  accessories: 'Accessories Summary',
}

/** mm → sq ft (same factor the app uses). */
function sqft(wMm: number, hMm: number): number {
  return (wMm / 304.8) * (hMm / 304.8)
}
function sqmt(wMm: number, hMm: number): number {
  return (wMm / 1000) * (hMm / 1000)
}

function reportHeader(doc: jsPDF, data: ReportData, title: string): number {
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, PAGE_W, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(data.company_name || 'Soft Window', MARGIN, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(title, MARGIN, 19)
  doc.text(`Quotation ${data.quotation_number}`, PAGE_W - MARGIN, 12, { align: 'right' })
  doc.text(data.client_name, PAGE_W - MARGIN, 19, { align: 'right' })
  return 34
}

function reportFooter(doc: jsPDF, data: ReportData) {
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 220, 220)
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(data.company_name || 'Soft Window', MARGIN, PAGE_H - 9)
    doc.text(`Page ${i} of ${n}`, PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' })
  }
}

/* ------------------------------------------------------------------ *
 * Report builders
 * ------------------------------------------------------------------ */

function buildProjectDimensions(doc: jsPDF, data: ReportData, startY: number) {
  let y = startY
  const cols = [
    { label: 'SL', x: MARGIN, w: 10 },
    { label: 'DESIGN REF', x: MARGIN + 10, w: 32 },
    { label: 'LOCATION', x: MARGIN + 42, w: 40 },
    { label: 'W (mm)', x: MARGIN + 82, w: 20 },
    { label: 'H (mm)', x: MARGIN + 102, w: 20 },
    { label: 'SQMT', x: MARGIN + 122, w: 18 },
    { label: 'SQFT', x: MARGIN + 140, w: 18 },
    { label: 'QTY', x: MARGIN + 158, w: 12 },
  ]
  doc.setFillColor(243, 246, 250)
  doc.rect(MARGIN, y - 5, CONTENT_W, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(90, 90, 90)
  for (const c of cols) doc.text(c.label, c.x + 1, y)
  y += 6

  let totalArea = 0
  let totalQty = 0
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  data.designs.forEach((d, i) => {
    if (y > PAGE_H - 24) {
      doc.addPage()
      y = reportHeader(doc, data, REPORT_TITLES['project-dimensions'])
    }
    const w = Number(d.width) || 0
    const h = Number(d.height) || 0
    const aSqft = w && h ? sqft(w, h) : Number(d.area_sqft) || 0
    const aSqmt = w && h ? sqmt(w, h) : aSqft / 10.7639
    totalArea += aSqft
    totalQty += 1
    const cells = [
      String(i + 1),
      d.name || '—',
      d.location || '—',
      w ? String(Math.round(w)) : '—',
      h ? String(Math.round(h)) : '—',
      aSqmt.toFixed(2),
      aSqft.toFixed(2),
      '1',
    ]
    cols.forEach((c, ci) => doc.text(cells[ci], c.x + 1, y))
    y += 6
  })

  y += 2
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, y - 4, PAGE_W - MARGIN, y - 4)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND)
  doc.text(`Total windows: ${totalQty}`, MARGIN + 1, y)
  doc.text(`Total area: ${totalArea.toFixed(2)} Sqft`, PAGE_W - MARGIN, y, { align: 'right' })
}

function buildDrawingsReport(
  doc: jsPDF,
  data: ReportData,
  startY: number,
  kind: ReportKind
) {
  let y = startY
  const cardH = 60
  const half = (CONTENT_W - 6) / 2
  let col = 0

  data.designs.forEach((d, i) => {
    if (y + cardH > PAGE_H - 18) {
      doc.addPage()
      y = reportHeader(doc, data, REPORT_TITLES[kind])
      col = 0
    }
    const x = MARGIN + col * (half + 6)
    doc.setDrawColor(225, 225, 225)
    doc.setFillColor(250, 250, 250)
    doc.roundedRect(x, y, half, cardH, 2, 2, 'FD')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text(`${i + 1}. ${d.name || 'Design'}`, x + 3, y + 6)

    drawDesignGeometry(doc, d.editor_document, x + 3, y + 9, half - 6, cardH - 26)

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(110, 110, 110)
    const specs = [
      `${d.location || '—'}`,
      `${Number(d.area_sqft).toFixed(2)} Sqft`,
      `${d.glass_type || '—'}`,
    ].join('  ·  ')
    doc.text(specs, x + 3, y + cardH - 4)

    col += 1
    if (col === 2) {
      col = 0
      y += cardH + 6
    }
  })
}

/** Accessory summary: sum selected accessories across all designs by name. */
function collectAccessories(designs: ReportDesign[]): { name: string; count: number; total: number }[] {
  const map = new Map<string, { name: string; count: number; total: number }>()
  const add = (acc: unknown) => {
    if (!acc || typeof acc !== 'object') return
    for (const entry of Object.values(acc as Record<string, { name?: string; price?: number } | null>)) {
      if (!entry?.name) continue
      const key = entry.name
      const cur = map.get(key) ?? { name: key, count: 0, total: 0 }
      cur.count += 1
      cur.total += Number(entry.price) || 0
      map.set(key, cur)
    }
  }
  for (const d of designs) {
    const doc2 = d.editor_document
    if (!isFrameDocument(doc2)) continue
    const frame = doc2 as FrameDocument
    for (const sec of frame.sections) {
      const props = sec.window?.props
      if (!props) continue
      add(props.accessories)
      const panelAcc = props.panelAccessories
      if (Array.isArray(panelAcc)) for (const p of panelAcc) add(p)
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function buildAccessories(doc: jsPDF, data: ReportData, startY: number) {
  let y = startY
  const rows = collectAccessories(data.designs)

  doc.setFillColor(243, 246, 250)
  doc.rect(MARGIN, y - 5, CONTENT_W, 8, 'F')
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(90, 90, 90)
  doc.text('S.NO', MARGIN + 2, y)
  doc.text('ACCESSORY', MARGIN + 20, y)
  doc.text('QTY', MARGIN + 110, y, { align: 'right' })
  doc.text('TOTAL', PAGE_W - MARGIN - 2, y, { align: 'right' })
  y += 6

  if (rows.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('No accessories selected on this quotation.', MARGIN + 2, y + 2)
    return
  }

  let grand = 0
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  rows.forEach((r, i) => {
    if (y > PAGE_H - 24) {
      doc.addPage()
      y = reportHeader(doc, data, REPORT_TITLES.accessories)
    }
    grand += r.total
    doc.text(String(i + 1), MARGIN + 2, y)
    doc.text(r.name, MARGIN + 20, y)
    doc.text(String(r.count), MARGIN + 110, y, { align: 'right' })
    doc.text(formatCurrency(r.total), PAGE_W - MARGIN - 2, y, { align: 'right' })
    y += 6
  })

  y += 2
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, y - 4, PAGE_W - MARGIN, y - 4)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND)
  doc.text('Total', MARGIN + 20, y)
  doc.text(formatCurrency(grand), PAGE_W - MARGIN - 2, y, { align: 'right' })
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export function generateReportPDF(kind: ReportKind, data: ReportData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const y = reportHeader(doc, data, REPORT_TITLES[kind])

  switch (kind) {
    case 'project-dimensions':
      buildProjectDimensions(doc, data, y)
      break
    case 'window-elevation':
    case 'typology':
      buildDrawingsReport(doc, data, y, kind)
      break
    case 'accessories':
      buildAccessories(doc, data, y)
      break
  }

  reportFooter(doc, data)
  return doc
}

export function downloadReportPDF(kind: ReportKind, data: ReportData) {
  const doc = generateReportPDF(kind, data)
  doc.save(`${kind}-${data.quotation_number}.pdf`)
}
