import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const statusStyles: Record<string, string> = {
  pending:
    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  partial: 'bg-primary-soft text-primary ring-1 ring-inset ring-primary/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, quotations(quotation_number, client_name, client_phone)')
    .eq('id', id)
    .single()

  if (error || !invoice) notFound()

  const due = invoice.amount - invoice.paid_amount
  const status = invoice.status as string

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/billing">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold leading-tight text-heading">
                {invoice.invoice_number}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  statusStyles[status] ?? statusStyles.pending
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Created on {formatDate(invoice.created_at)}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
            <Field label="Name" value={invoice.quotations?.client_name ?? '—'} />
            <Field label="Phone" value={invoice.quotations?.client_phone ?? '—'} />
            <Field
              label="Quotation"
              value={invoice.quotations?.quotation_number ?? '—'}
            />
            {invoice.due_date && (
              <Field label="Due Date" value={formatDate(invoice.due_date)} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-3 gap-4 py-5">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-xl font-bold text-heading">
              {formatCurrency(invoice.amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(invoice.paid_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance Due</p>
            <p
              className={`text-xl font-bold ${
                due > 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {formatCurrency(due)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  )
}
