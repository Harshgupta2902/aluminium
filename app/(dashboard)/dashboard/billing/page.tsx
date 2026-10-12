import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { connection } from 'next/server'
import Link from 'next/link'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
}

export default async function BillingPage() {
  // Reads cookies (session) at request time; keep out of the static shell.
  await connection()

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Invoicing</h1>
          <p className="text-gray-600 mt-1">
            Manage invoices and track payments
          </p>
        </div>
        <Link href="/dashboard/billing/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <DollarSign className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{invoices?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">{paidCount} paid, {pendingCount} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {!invoices || invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No invoices yet</p>
              <Link href="/dashboard/billing/new">
                <Button>Create Your First Invoice</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {invoice.invoice_number}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusColors[invoice.status as keyof typeof statusColors]
                        }`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-gray-900">
                        <span className="font-medium">Client:</span>{' '}
                        {invoice.quotations?.client_name || 'N/A'}
                      </p>
                      {invoice.quotations?.quotation_number && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Quotation:</span>{' '}
                          {invoice.quotations.quotation_number}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(invoice.created_at)}
                      </p>
                      {invoice.due_date && (
                        <p className="text-sm text-gray-500">
                          Due: {formatDate(invoice.due_date)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Paid</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(invoice.paid_amount)}
                      </p>
                    </div>
                    {invoice.amount > invoice.paid_amount && (
                      <div>
                        <p className="text-xs text-gray-600">Due</p>
                        <p className="text-sm font-semibold text-red-600">
                          {formatCurrency(invoice.amount - invoice.paid_amount)}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Link href={`/dashboard/billing/${invoice.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                      <Button size="sm">
                        Record Payment
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
