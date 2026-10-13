import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/dashboard/page-header'
import { loadAdminUsers } from '../data'
import { PermissionsTable } from './permissions-table'
import { EmptyState } from '@/components/admin/ui'
import { ShieldHalf } from 'lucide-react'

export const metadata = { title: 'User permissions · Admin · SoftWindow' }

export default async function AdminPermissionsPage() {
  const users = await loadAdminUsers()

  return (
    <div className="space-y-4">
      <PageHeader
        title="User permissions"
        description="Control account access and which sections each user can use."
      />

      <Card className="overflow-hidden">
        {users.length === 0 ? (
          <EmptyState
            icon={ShieldHalf}
            title="No users to manage"
            description="Once you add users, you can control their access here."
          />
        ) : (
          <PermissionsTable
            users={users.map((u) => ({
              id: u.id,
              full_name: u.full_name,
              email: u.email,
              is_active: u.is_active,
              can_access_designs: u.can_access_designs,
              can_access_billing: u.can_access_billing,
              can_access_inventory: u.can_access_inventory,
            }))}
          />
        )}
      </Card>
    </div>
  )
}
