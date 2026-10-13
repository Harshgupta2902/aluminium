import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { QuotationChart } from '@/components/dashboard/quotation-chart'
import { AdminStat, SectionLabel } from '@/components/admin/ui'
import { loadAdminStats } from './data'
import { formatCurrency } from '@/lib/utils'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  FileText,
  Palette,
  Wallet,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react'

export const metadata = { title: 'Admin Dashboard · SoftWindow' }

export default async function AdminDashboardPage() {
  const stats = await loadAdminStats()

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of users, usage and billing.">
        <Link href="/dashboard/admin/users/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </Link>
      </PageHeader>

      {/* Users */}
      <section className="space-y-3">
        <SectionLabel>Users</SectionLabel>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminStat label="Total users" value={stats.totalUsers} icon={Users} tone="primary" />
          <AdminStat label="Active" value={stats.activeUsers} icon={UserCheck} tone="emerald" />
          <AdminStat label="Inactive" value={stats.inactiveUsers} icon={UserX} tone="rose" />
          <AdminStat label="Expired plan" value={stats.expiredUsers} icon={Clock} tone="amber" />
        </div>
      </section>

      {/* Usage & revenue */}
      <section className="space-y-3">
        <SectionLabel>Usage &amp; revenue</SectionLabel>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <AdminStat label="Quotations" value={stats.totalQuotations} icon={FileText} tone="violet" />
          <AdminStat label="Designs" value={stats.totalDesigns} icon={Palette} tone="violet" />
          <AdminStat
            label="Collected"
            value={formatCurrency(stats.revenueCollected)}
            icon={TrendingUp}
            tone="emerald"
            valueColored
          />
          <AdminStat
            label="Pending"
            value={formatCurrency(stats.revenuePending)}
            icon={Wallet}
            tone="amber"
            valueColored
          />
          <AdminStat label="Paid periods" value={stats.billingPaid} icon={CheckCircle2} tone="emerald" />
          <AdminStat label="Unpaid periods" value={stats.billingUnpaid} icon={AlertCircle} tone="amber" />
        </div>
      </section>

      {/* Charts */}
      <section className="space-y-3">
        <SectionLabel>Activity</SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <QuotationChart data={stats.quotationsByMonth} />
          </div>
          <UserStatusCard
            active={stats.activeUsers}
            inactive={stats.inactiveUsers}
            total={stats.totalUsers}
          />
        </div>
      </section>
    </div>
  )
}

/** Proportional active/inactive split — no external chart dependency. */
function UserStatusCard({
  active,
  inactive,
  total,
}: {
  active: number
  inactive: number
  total: number
}) {
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0
  const inactivePct = total > 0 ? 100 - activePct : 0
  return (
    <Card>
      <CardHeader>
        <CardTitle>User status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold tracking-tight text-heading">{total}</p>
                <p className="text-xs text-muted-foreground">total accounts</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {activePct}%
                </p>
                <p className="text-xs text-muted-foreground">active</p>
              </div>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="bg-emerald-500 transition-all" style={{ width: `${activePct}%` }} />
              <div className="bg-rose-400 transition-all" style={{ width: `${inactivePct}%` }} />
            </div>
            <div className="space-y-2 text-sm">
              <Legend color="bg-emerald-500" label="Active" value={active} pct={activePct} />
              <Legend color="bg-rose-400" label="Inactive" value={inactive} pct={inactivePct} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Legend({
  color,
  label,
  value,
  pct,
}: {
  color: string
  label: string
  value: number
  pct: number
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-medium text-heading">
        {value} <span className="text-xs text-muted-foreground">({pct}%)</span>
      </span>
    </div>
  )
}
