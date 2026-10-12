import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Quotation {
  id: string
  quotation_number: string
  client_name: string
  total_amount: number
  status: string
  created_at: string
}

interface RecentQuotationsProps {
  quotations: Quotation[]
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export function RecentQuotations({ quotations }: RecentQuotationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Quotations</CardTitle>
        <Link 
          href="/dashboard/quotations" 
          className="text-sm text-blue-600 hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quotations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No quotations yet. Create your first one!
            </p>
          ) : (
            quotations.map((quotation) => (
              <div
                key={quotation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {quotation.quotation_number}
                    </p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[quotation.status as keyof typeof statusColors]
                      }`}
                    >
                      {quotation.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {quotation.client_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(quotation.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(quotation.total_amount)}
                  </p>
                  <Link
                    href={`/dashboard/quotations/${quotation.id}`}
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
