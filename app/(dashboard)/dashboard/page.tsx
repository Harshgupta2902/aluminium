import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { RecentQuotations } from '@/components/dashboard/recent-quotations'
import { QuotationChart } from '@/components/dashboard/quotation-chart'
import { FileText, IndianRupee, Palette, Send } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  // This page reads cookies (session), live Supabase data, and the current
  // date (new Date()). All of that is request-time work that can't be
  // prerendered, so stop prerendering here.
  await connection()

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
  const { data: todayQuotations, count: todayCount } = await supabase
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

  // Fetch designs created this month
  const { count: designsCount } = await supabase
    .from('window_designs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  // Fetch recent quotations
  const { data: recentQuotations } = await supabase
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/quotations/new">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              New Quotation
            </Button>
          </Link>
          <Link href="/dashboard/designs/new">
            <Button variant="outline">
              <Palette className="w-4 h-4 mr-2" />
              New Design
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          title="Designs Created"
          value={designsCount || 0}
          changeLabel="This month"
          icon={Palette}
        />
        <StatCard
          title="PDF Sent via WA"
          value={todayCount || 0}
          changeLabel="Today"
          icon={Send}
        />
      </div>

      {/* Chart */}
      <QuotationChart data={chartData} />

      {/* Recent Quotations */}
      <RecentQuotations quotations={recentQuotations || []} />
    </div>
  )
}
