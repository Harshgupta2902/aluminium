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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Left column — client + designs + notes */}
      <div className="space-y-4 lg:col-span-2">
        {/* Client Information — compact strip */}
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <Field label="Client" value={quotation.client_name} />
              <Field label="Phone" value={quotation.client_phone} />
              {quotation.client_email && <Field label="Email" value={quotation.client_email} />}
              {quotation.valid_until && (
                <Field label="Valid Until" value={formatDate(quotation.valid_until)} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Designs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
            <CardTitle className="text-base">Designs</CardTitle>
            <span className="text-xs text-muted-foreground">
              {designs.length} · {totalArea.toFixed(2)} Sqft
            </span>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
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
                  <div className="flex h-[88px] w-[120px] shrink-0 items-center justify-center rounded-md bg-secondary/40">
                    {design.editor_document ? (
                      <DesignPreview document={design.editor_document} width={116} height={84} />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">No preview</span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="truncate text-sm font-semibold text-heading">
                        {index + 1}. {design.name || 'Untitled design'}
                      </h4>
                      <p className="shrink-0 text-sm font-bold text-primary">
                        {formatCurrency(design.amount)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                      <Field label="Area" value={`${Number(design.area_sqft).toFixed(2)} Sqft`} dense />
                      <Field label="Rate/Sqft" value={formatCurrency(design.rate_per_sqft)} dense />
                      <Field label="Glass" value={design.glass_type || '—'} dense />
                      <Field label="Color" value={design.color || '—'} dense capitalize />
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
            <CardHeader className="py-3">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="whitespace-pre-wrap text-sm text-foreground">{quotation.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right column — sticky price summary */}
      <div className="lg:col-span-1">
        <Card className="lg:sticky lg:top-4">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Price Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="divide-y divide-border/60 text-sm">
              <SummaryLine label="Base (designs)" value={formatCurrency(price.base)} />
              {price.installation > 0 && (
                <SummaryLine
                  label={`Installation · ${num(quotation.installation_charge)}/sqft`}
                  value={formatCurrency(price.installation)}
                />
              )}
              {price.labour > 0 && (
                <SummaryLine
                  label={`Labour · ${num(quotation.labour_charge)}/sqft`}
                  value={formatCurrency(price.labour)}
                />
              )}
              {price.profit > 0 && (
                <SummaryLine
                  label={`Profit · ${num(quotation.profit_percentage)}%`}
                  value={formatCurrency(price.profit)}
                />
              )}
              {price.wastage > 0 && (
                <SummaryLine
                  label={`Wastage · ${num(quotation.profile_wastage) + num(quotation.glass_wastage)}%`}
                  value={formatCurrency(price.wastage)}
                />
              )}
              {price.transport > 0 && (
                <SummaryLine label="Transport" value={formatCurrency(price.transport)} />
              )}
              {(headRows ?? []).map((h, i) => (
                <SummaryLine key={i} label={h.label || 'Charge'} value={formatCurrency(num(h.amount))} />
              ))}

              {price.discountAmount > 0 && (
                <SummaryLine
                  label={
                    quotation.discount_type === 'fixed'
                      ? 'Discount'
                      : `Discount · ${num(quotation.discount)}%`
                  }
                  value={`− ${formatCurrency(price.discountAmount)}`}
                  tone="discount"
                />
              )}

              <SummaryLine label="Subtotal" value={formatCurrency(price.subtotal)} strong />

              {price.cgstAmount > 0 && (
                <SummaryLine label={`CGST · ${num(quotation.cgst)}%`} value={formatCurrency(price.cgstAmount)} />
              )}
              {price.sgstAmount > 0 && (
                <SummaryLine label={`SGST · ${num(quotation.sgst)}%`} value={formatCurrency(price.sgstAmount)} />
              )}
              {price.igstAmount > 0 && (
                <SummaryLine label={`IGST · ${num(quotation.igst)}%`} value={formatCurrency(price.igstAmount)} />
              )}
            </dl>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-primary-soft/50 px-3 py-2.5">
              <span className="text-sm font-semibold text-heading">Grand Total</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(price.grandTotal)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function SummaryLine({
  label,
  value,
  strong,
  tone,
}: {
  label: string
  value: string
  strong?: boolean
  tone?: 'discount'
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <dt className={`text-xs ${strong ? 'font-semibold text-heading' : 'text-muted-foreground'}`}>
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          tone === 'discount'
            ? 'font-medium text-emerald-600 dark:text-emerald-400'
            : strong
              ? 'font-semibold text-heading'
              : 'text-foreground'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function Field({
  label,
  value,
  capitalize,
  dense,
}: {
  label: string
  value: string
  capitalize?: boolean
  dense?: boolean
}) {
  if (dense) {
    return (
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-muted-foreground">{label}:</span>
        <span className={`font-medium text-foreground ${capitalize ? 'capitalize' : ''}`}>
          {value}
        </span>
      </span>
    )
  }
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium text-foreground ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  )
}
