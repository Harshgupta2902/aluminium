import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DownloadPDFButton } from '@/components/quotations/download-pdf-button'
import { SendWhatsAppButton } from '@/components/quotations/send-whatsapp-button'

const statusStyles: Record<string, string> = {
  draft:
    'bg-secondary text-secondary-foreground ring-1 ring-inset ring-border-strong',
  sent: 'bg-primary-soft text-primary ring-1 ring-inset ring-primary/20',
  approved:
    'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  rejected:
    'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
}

interface QuotationLineItem {
  window_type: string
  dimensions: { width: number; height: number }
  quantity: number
  profile_type: string
  glass_type: string
  color: string
  profile_cost: number
  glass_cost: number
  labour_cost: number
  accessories_cost: number
  total_cost: number
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

  const items: QuotationLineItem[] = quotation.items || []
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

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold capitalize text-heading">
                    {item.window_type} Window
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {item.dimensions.width}mm × {item.dimensions.height}mm
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="text-sm font-semibold text-heading">{item.quantity}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <Field label="Profile" value={item.profile_type} capitalize />
                <Field label="Glass" value={item.glass_type} capitalize />
                <Field label="Color" value={item.color} capitalize />
              </div>

              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                  <Cost label="Profile" value={item.profile_cost} />
                  <Cost label="Glass" value={item.glass_cost} />
                  <Cost label="Labour" value={item.labour_cost} />
                  <Cost label="Accessories" value={item.accessories_cost} />
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">
                      {formatCurrency(item.total_cost)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
          <div>
            <p className="text-xs text-muted-foreground">Total Items</p>
            <p className="text-xl font-bold text-heading">{items.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Grand Total</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(quotation.total_amount)}
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

function Cost({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{formatCurrency(value)}</p>
    </div>
  )
}
