import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { Plus, FileText, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  partial: 'bg-primary-soft text-primary ring-1 ring-inset ring-primary/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
}

export default async function BillingPage() {
  const supabase = await createClient()

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, quotations(quotation_number, client_name)')
    .order('created_at', { ascending: false })

  // Calculate totals
  const totalAmount = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0
  const totalPaid = invoices?.reduce((sum, inv) => sum + inv.paid_amount, 0) || 0
  const totalPending = totalAmount - totalPaid

  const pendingCount = invoices?.filter(inv => inv.status === 'pending').length || 0
  const paidCount = invoices?.filter(inv => inv.status === 'paid').length || 0

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalAmount), className: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Total Paid', value: formatCurrency(totalPaid), className: 'text-primary' },
    { label: 'Pending', value: formatCurrency(totalPending), className: 'text-amber-600 dark:text-amber-400' },
    { label: 'Invoices', value: invoices?.length || 0, hint: `${paidCount} paid, ${pendingCount} pending`, className: 'text-heading' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Billing & Invoicing"
        description="Manage invoices and track payments"
      >
        <Link href="/dashboard/billing/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.className}`}>{s.value}</p>
            {s.hint && <p className="mt-0.5 text-xs text-muted-foreground">{s.hint}</p>}
          </Card>
        ))}
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!invoices || invoices.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No invoices yet</p>
              <Link href="/dashboard/billing/new">
                <Button>Create Your First Invoice</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5">Invoice #</th>
                    <th className="px-4 py-2.5">Client</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Created</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5 text-right">Paid</th>
                    <th className="px-4 py-2.5 text-right">Due</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const due = invoice.amount - invoice.paid_amount
                    return (
                      <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium text-heading whitespace-nowrap">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-foreground">{invoice.quotations?.client_name || 'N/A'}</div>
                          {invoice.quotations?.quotation_number && (
                            <div className="text-xs text-muted-foreground">
                              {invoice.quotations.quotation_number}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              statusColors[invoice.status as keyof typeof statusColors]
                            }`}
                          >
                            {invoice.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {formatDate(invoice.created_at)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-heading whitespace-nowrap">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(invoice.paid_amount)}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <span className={due > 0 ? 'font-semibold text-destructive' : 'text-muted-foreground'}>
                            {formatCurrency(due)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/billing/${invoice.id}`} title="View invoice">
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View invoice</span>
                              </Button>
                            </Link>
                            <Button size="sm">Record</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
