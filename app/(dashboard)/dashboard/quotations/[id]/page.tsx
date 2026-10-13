import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DownloadPDFButton } from '@/components/quotations/download-pdf-button'
import { SendWhatsAppButton } from '@/components/quotations/send-whatsapp-button'
import { DesignPreview } from '@/components/design-editor/design-preview'
import type { DesignDocument } from '@/lib/design-editor/model'

const statusStyles: Record<string, string> = {
  draft:
    'bg-secondary text-secondary-foreground ring-1 ring-inset ring-border-strong',
  sent: 'bg-primary-soft text-primary ring-1 ring-inset ring-primary/20',
  approved:
    'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  rejected:
    'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
}

interface DesignRow {
  id: string
  name: string
  color: string | null
  glass_type: string | null
  area_sqft: number
  rate_per_sqft: number
  amount: number
  editor_document: DesignDocument | null
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quotation, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !quotation) {
    notFound()
  }

  const { data: designRows } = await supabase
    .from('window_designs')
    .select('id, name, color, glass_type, area_sqft, rate_per_sqft, amount, editor_document')
    .eq('quotation_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const designs: DesignRow[] = (designRows as DesignRow[]) ?? []
  const totalArea = designs.reduce((sum, d) => sum + (Number(d.area_sqft) || 0), 0)
  const grandTotal = designs.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
  const status = quotation.status as string

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/quotations">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold leading-tight text-heading">
                {quotation.quotation_number}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  statusStyles[status] ?? statusStyles.draft
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Created on {formatDate(quotation.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/quotations/new?edit=${quotation.id}`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DownloadPDFButton quotation={quotation} />
          <SendWhatsAppButton quotation={quotation} />
        </div>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
            <Field label="Name" value={quotation.client_name} />
            <Field label="Phone" value={quotation.client_phone} />
            {quotation.client_email && (
              <Field label="Email" value={quotation.client_email} />
            )}
            {quotation.valid_until && (
              <Field label="Valid Until" value={formatDate(quotation.valid_until)} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Designs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Designs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {designs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No designs on this quotation.
            </p>
          ) : (
            designs.map((design, index) => (
              <div
                key={design.id}
                className="flex flex-col gap-4 rounded-lg border border-border p-3 sm:flex-row"
              >
                <div className="flex shrink-0 items-center justify-center rounded-md bg-secondary/40 p-2">
                  {design.editor_document ? (
                    <DesignPreview
                      document={design.editor_document}
                      width={240}
                      height={190}
                    />
                  ) : (
                    <div className="flex h-[190px] w-[240px] items-center justify-center text-xs text-muted-foreground">
                      No preview
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-heading">
                        {index + 1}. {design.name || 'Untitled design'}
                      </h4>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(design.amount)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <Field
                      label="Area"
                      value={`${Number(design.area_sqft).toFixed(2)} Sqft`}
                    />
                    <Field
                      label="Rate/Sqft"
                      value={formatCurrency(design.rate_per_sqft)}
                    />
                    <Field
                      label="Glass"
                      value={design.glass_type || '—'}
                    />
                    <Field label="Color" value={design.color || '—'} capitalize />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {quotation.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {quotation.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Total */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-muted-foreground">Total Designs</p>
              <p className="text-xl font-bold text-heading">{designs.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Area</p>
              <p className="text-xl font-bold text-heading">
                {totalArea.toFixed(2)} Sqft
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Grand Total</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(grandTotal)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  value,
  capitalize,
}: {
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium text-foreground ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  )
}


