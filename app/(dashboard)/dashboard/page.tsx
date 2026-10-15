import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { QuotationChart } from '@/components/dashboard/quotation-chart'
import { PageHeader } from '@/components/dashboard/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, IndianRupee, FileStack, Users, Plus, UserPlus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get this month's date range
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  // Fetch today's quotations count
  const { count: todayCount } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())

  // Fetch last period for comparison (yesterday)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const { count: yesterdayCount } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', today.toISOString())

  const todayQuotesChange = yesterdayCount ? 
    Math.round(((todayCount || 0) - yesterdayCount) / yesterdayCount * 100) : 0

  // Fetch this month's revenue
  const { data: monthRevenue } = await supabase
    .from('quotations')
    .select('total_amount')
    .eq('status', 'approved')
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString())

  const revenueMTD = monthRevenue?.reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0

  // Fetch last month's revenue for comparison
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
  const { data: lastMonthRevenue } = await supabase
    .from('quotations')
    .select('total_amount')
    .eq('status', 'approved')
    .gte('created_at', lastMonthStart.toISOString())
    .lte('created_at', lastMonthEnd.toISOString())

  const lastMonthTotal = lastMonthRevenue?.reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0
  const revenueChange = lastMonthTotal ? 
    Math.round((revenueMTD - lastMonthTotal) / lastMonthTotal * 100) : 0

  // Totals.
  const { count: totalQuotations } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })

  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  // This month: quote count + pipeline value (all quotes, not just approved).
  const { data: monthQuotes } = await supabase
    .from('quotations')
    .select('total_amount, grand_total')
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString())

  const monthCount = monthQuotes?.length ?? 0
  const pipelineMTD =
    monthQuotes?.reduce(
      (sum, q) => sum + (Number(q.grand_total) || Number(q.total_amount) || 0),
      0
    ) || 0
  const avgQuote = monthCount > 0 ? Math.round(pipelineMTD / monthCount) : 0

  // Generate chart data (last 7 months)
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)
    
    const { count } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthDate.toISOString())
      .lte('created_at', monthEnd.toISOString())

    chartData.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      count: count || 0,
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening today."
      >
        <Link href="/dashboard/quotations/new">
          <Button>
            <FileText className="h-4 w-4" />
            New Quotation
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Quotes"
          value={todayCount || 0}
          change={todayQuotesChange}
          icon={FileText}
          trend={todayQuotesChange >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Revenue MTD"
          value={formatCurrency(revenueMTD)}
          change={revenueChange}
          icon={IndianRupee}
          trend={revenueChange >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Total Quotations"
          value={totalQuotations || 0}
          changeLabel="All time"
          icon={FileStack}
        />
        <StatCard
          title="Total Clients"
          value={totalClients || 0}
          changeLabel="All time"
          icon={Users}
        />
      </div>

      {/* Chart + side panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuotationChart data={chartData} />
        </div>

        <div className="space-y-4">
          {/* This month summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <SummaryRow label="Quotations created" value={String(monthCount)} />
              <SummaryRow label="Pipeline value" value={formatCurrency(pipelineMTD)} />
              <SummaryRow label="Avg. quote value" value={formatCurrency(avgQuote)} />
              <SummaryRow label="Approved revenue" value={formatCurrency(revenueMTD)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-heading">{value}</span>
    </div>
  )
}
