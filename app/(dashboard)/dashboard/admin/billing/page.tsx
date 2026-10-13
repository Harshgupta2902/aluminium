import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/dashboard/page-header'
import { formatDate } from '@/lib/utils'
import { loadAdminUsers } from '../data'
import { AdminStat, UserCell, StatusPill, EmptyState } from '@/components/admin/ui'
import { ChevronRight, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'

export const metadata = { title: 'Billing · Admin · SoftWindow' }

export default async function AdminBillingPage() {
  const users = await loadAdminUsers()
  const today = new Date().toISOString().slice(0, 10)

  const withPlan = users.filter((u) => u.plan_name)
  const paid = withPlan.filter((u) => u.is_paid).length
  const unpaid = withPlan.length - paid

  return (
    <div className="space-y-4">
      <PageHeader title="Billings" description="Per-user plans and payment status." />

      <div className="grid grid-cols-3 gap-3">
        <AdminStat label="On a plan" value={withPlan.length} icon={CreditCard} tone="primary" />
        <AdminStat label="Paid" value={paid} icon={CheckCircle2} tone="emerald" />
        <AdminStat label="Unpaid" value={unpaid} icon={AlertCircle} tone="amber" />
      </div>

      <Card className="overflow-hidden">
        {withPlan.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No billing periods yet"
            description="Add a user with a plan, or open a user to create their first billing period."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  if (!u.plan_name) return null
                  const expired = !u.period_ends || u.period_ends < today
                  return (
                    <tr
                      key={u.id}
                      className="group border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/admin/users/${u.id}`} className="block">
                          <UserCell name={u.full_name} email={u.email} />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground">{u.plan_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u.period_ends ? (
                          <span className="flex items-center gap-2">
                            <span className={expired ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                              {formatDate(u.period_ends)}
                            </span>
                            {expired && <StatusPill status="expired" />}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={u.is_paid ? 'paid' : 'unpaid'} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/users/${u.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:text-primary hover:bg-primary-soft"
                          title="Manage billing"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
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
