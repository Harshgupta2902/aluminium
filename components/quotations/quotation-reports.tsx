'use client'

import { useState } from 'react'
import { Ruler, LayoutGrid, Shapes, FileText, Scissors, ShoppingCart, Layers, Lock, Download } from 'lucide-react'
import {
  downloadReportPDF,
  type ReportData,
  type ReportKind,
} from '@/lib/reports-generator'

interface ReportCard {
  kind: ReportKind | null
  title: string
  description: string
  icon: typeof Ruler
  available: boolean
}

const CARDS: ReportCard[] = [
  { kind: 'project-dimensions', title: 'Project Dimensions', description: 'Sizes, area (sqmt/sqft) and quantities per design.', icon: Ruler, available: true },
  { kind: 'window-elevation', title: 'Window Elevation', description: 'Elevation drawings with specs for each window.', icon: LayoutGrid, available: true },
  { kind: 'typology', title: 'Typology Report', description: 'Design drawings grouped as typologies.', icon: Shapes, available: true },
  { kind: 'accessories', title: 'Accessories Summary', description: 'Selected accessories with counts and totals.', icon: FileText, available: true },
  { kind: null, title: 'Cutting List', description: 'Profile cut lengths & wastage. Needs the BOM engine.', icon: Scissors, available: false },
  { kind: null, title: 'Purchase Order', description: 'Profile lengths → stock bars. Needs the BOM engine.', icon: ShoppingCart, available: false },
  { kind: null, title: 'Glazing Report', description: 'Glass cut sizes & wastage. Needs the BOM engine.', icon: Layers, available: false },
]

export function QuotationReports({ data }: { data: ReportData }) {
  const [busy, setBusy] = useState<ReportKind | null>(null)

  const download = (kind: ReportKind) => {
    setBusy(kind)
    try {
      downloadReportPDF(kind, data)
    } finally {
      setBusy(null)
    }
  }

  const hasDesigns = data.designs.length > 0

  return (
    <div className="space-y-4">
      {!hasDesigns && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Add designs to this quotation to generate reports.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => {
          const Icon = c.icon
          const disabled = !c.available || !hasDesigns || !c.kind
          return (
            <div
              key={c.title}
              className={`flex flex-col rounded-xl border p-4 transition-colors ${
                disabled
                  ? 'border-border bg-muted/30'
                  : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    disabled ? 'bg-muted text-muted-foreground' : 'bg-primary-soft/50 text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {!c.available && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Lock className="h-3 w-3" /> Coming soon
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-heading">{c.title}</h3>
              <p className="mt-0.5 flex-1 text-xs text-muted-foreground">{c.description}</p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => c.kind && download(c.kind)}
                className={`mt-3 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  disabled
                    ? 'cursor-not-allowed bg-muted text-muted-foreground'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                {busy === c.kind ? 'Preparing…' : 'Download PDF'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
