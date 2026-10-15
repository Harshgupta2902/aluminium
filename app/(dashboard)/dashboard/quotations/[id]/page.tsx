import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesignPreview } from '@/components/design-editor/design-preview'
import type { DesignDocument } from '@/lib/design-editor/model'
import { computeQuotationPrice, type QuotationOverheads } from '@/lib/quotation-pricing'

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

  const { data: headRows } = await supabase
    .from('quotation_cost_heads')
    .select('label, amount')
    .eq('quotation_id', id)
    .order('sort_order', { ascending: true })

  const designs: DesignRow[] = (designRows as DesignRow[]) ?? []
  const totalArea = designs.reduce((sum, d) => sum + (Number(d.area_sqft) || 0), 0)

  const price = computeQuotationPrice(
    designs,
    quotation as Partial<QuotationOverheads>,
    headRows ?? []
  )

  return (
    <div className="space-y-4">
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
        <CardContent className="space-y-2">
          {designs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No designs on this quotation.
            </p>
          ) : (
            designs.map((design, index) => (
              <div
                key={design.id}
                className="flex gap-3 rounded-lg border border-border p-2.5"
              >
                <div className="flex h-[108px] w-[150px] shrink-0 items-center justify-center rounded-md bg-secondary/40">
                  {design.editor_document ? (
                    <DesignPreview
                      document={design.editor_document}
                      width={146}
                      height={104}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No preview</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="truncate text-sm font-semibold text-heading">
                      {index + 1}. {design.name || 'Untitled design'}
                    </h4>
                    <p className="shrink-0 text-base font-bold text-primary">
                      {formatCurrency(design.amount)}
                    </p>
                  </div>
                  <div className="grid max-w-2xl grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
                    <Field label="Area" value={`${Number(design.area_sqft).toFixed(2)} Sqft`} />
                    <Field label="Rate/Sqft" value={formatCurrency(design.rate_per_sqft)} />
                    <Field label="Glass" value={design.glass_type || '—'} />
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
              {formatCurrency(price.grandTotal)}
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
