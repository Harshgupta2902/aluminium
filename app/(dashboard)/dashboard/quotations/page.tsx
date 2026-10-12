import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DownloadPDFButton } from '@/components/quotations/download-pdf-button'
import { connection } from 'next/server'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default async function QuotationsPage() {
  // Reads cookies (session) at request time; keep out of the static shell.
  await connection()

  const supabase = await createClient()
  
  const { data: quotations } = await supabase
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">
            Manage all your quotations in one place
          </p>
        </div>
        <Link href="/dashboard/quotations/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {!quotations || quotations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No quotations yet</p>
              <Link href="/dashboard/quotations/new">
                <Button>Create Your First Quotation</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {quotation.quotation_number}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusColors[quotation.status as keyof typeof statusColors]
                        }`}
                      >
                        {quotation.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-gray-900">
                        <span className="font-medium">Client:</span> {quotation.client_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {quotation.client_phone}
                      </p>
                      {quotation.client_email && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {quotation.client_email}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(quotation.created_at)}
                      </p>
                      {quotation.valid_until && (
                        <p className="text-sm text-gray-500">
                          Valid Until: {formatDate(quotation.valid_until)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(quotation.total_amount)}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/quotations/${quotation.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                      <DownloadPDFButton quotation={quotation} size="sm" />
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
