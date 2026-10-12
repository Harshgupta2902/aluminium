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
  draft: 'bg-secondary text-secondary-foreground ring-1 ring-inset ring-border-strong',
  sent: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
}

export function RecentQuotations({ quotations }: RecentQuotationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Quotations</CardTitle>
        <Link 
          href="/dashboard/quotations" 
          className="text-sm font-medium text-primary hover:text-primary-hover hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quotations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No quotations yet. Create your first one!
            </p>
          ) : (
            quotations.map((quotation) => (
              <div
                key={quotation.id}
                className="flex items-center justify-between rounded-xl border border-border p-4 transition-all duration-150 hover:border-border-strong hover:bg-muted/60 hover:shadow-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {quotation.quotation_number}
                    </p>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                        statusColors[quotation.status as keyof typeof statusColors]
                      }`}
                    >
                      {quotation.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {quotation.client_name}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDate(quotation.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(quotation.total_amount)}
                  </p>
                  <Link
                    href={`/dashboard/quotations/${quotation.id}`}
                    className="text-xs font-medium text-primary hover:text-primary-hover hover:underline mt-1 inline-block"
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
