import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Avatar, StatusPill } from '@/components/admin/ui'
import { ArrowLeft } from 'lucide-react'
import { ManageUser } from './manage-user'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, company_name, phone, role, is_active, can_access_designs, can_access_billing, can_access_inventory, created_at'
    )
    .eq('id', id)
    .single()

  if (!profile || profile.role === 'superadmin') notFound()

  const { data: periods } = await supabase
    .from('billing_periods')
    .select('id, plan_name, amount, starts_at, ends_at, quotation_limit, is_paid, notes, created_at')
    .eq('user_id', id)
    .order('ends_at', { ascending: false })

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={profile.full_name || profile.email} size={44} />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold leading-tight text-heading">
                {profile.full_name}
              </h1>
              <StatusPill status={profile.is_active ? 'active' : 'inactive'} />
            </div>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <Link href="/dashboard/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Users
          </Button>
        </Link>
      </div>

      <ManageUser profile={profile} periods={periods ?? []} />
    </div>
  )
}
