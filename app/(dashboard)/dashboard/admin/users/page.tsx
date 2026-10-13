import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { formatDate } from '@/lib/utils'
import { loadAdminUsers } from '../data'
import { UserCell, StatusPill, UsageBar, EmptyState } from '@/components/admin/ui'
import { Plus, ChevronRight, Users as UsersIcon } from 'lucide-react'

export const metadata = { title: 'Users · Admin · SoftWindow' }

export default async function AdminUsersPage() {
  const users = await loadAdminUsers()
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-4">
      <PageHeader title="Users" description="All accounts you manage.">
        <Link href="/dashboard/admin/users/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </Link>
      </PageHeader>

      <Card className="overflow-hidden">
        {users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users yet"
            description="Create your first user account to get started. They'll receive their login details by email."
            action={
              <Link href="/dashboard/admin/users/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Add your first user
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3 text-right">Quotations</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
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
                      <td className="px-4 py-3">
                        <StatusPill status={u.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-4 py-3">
                        {u.plan_name ? (
                          <span className="text-foreground">{u.plan_name}</span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
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
                        <UsageBar used={u.quotations_used} limit={u.quotation_limit} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/users/${u.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:text-primary hover:bg-primary-soft"
                          title="Manage user"
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
