import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Eye } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DownloadPDFButton } from '@/components/quotations/download-pdf-button'

const statusColors = {
  draft: 'bg-secondary text-secondary-foreground ring-1 ring-inset ring-border-strong',
  sent: 'bg-primary-soft text-primary ring-1 ring-inset ring-primary/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
}

export default async function QuotationsPage() {
  const supabase = await createClient()

  const { data: quotations } = await supabase
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false })

  // Aggregate each quotation's designs (area + amount) in a single query.
  const quotationIds = (quotations ?? []).map((q) => q.id)
  const totalsByQuotation = new Map<string, { area: number; amount: number }>()
  if (quotationIds.length > 0) {
    const { data: designRows } = await supabase
      .from('window_designs')
      .select('quotation_id, area_sqft, amount')
      .in('quotation_id', quotationIds)

    for (const row of designRows ?? []) {
      if (!row.quotation_id) continue
      const current = totalsByQuotation.get(row.quotation_id) ?? {
        area: 0,
        amount: 0,
      }
      current.area += Number(row.area_sqft) || 0
      current.amount += Number(row.amount) || 0
      totalsByQuotation.set(row.quotation_id, current)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-heading">Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Manage all your quotations in one place
          </p>
        </div>
        <Link href="/dashboard/quotations/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {!quotations || quotations.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No quotations yet</p>
            <Link href="/dashboard/quotations/new">
              <Button>Create Your First Quotation</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Quotation #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Area (Sqft)</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation) => {
                  const totals = totalsByQuotation.get(quotation.id)
                  const amount = totals?.amount ?? quotation.total_amount
                  const area = totals?.area ?? 0
                  return (
                  <tr
                    key={quotation.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-heading whitespace-nowrap">
                      {quotation.quotation_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {quotation.client_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {quotation.client_phone}
                        {quotation.client_email ? ` · ${quotation.client_email}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[quotation.status as keyof typeof statusColors]
                        }`}
                      >
                        {quotation.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(quotation.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">
                      {area > 0 ? `${area.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary whitespace-nowrap">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/quotations/${quotation.id}`} title="View details">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                        </Link>
                        <DownloadPDFButton quotation={quotation} size="sm" iconOnly />
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
