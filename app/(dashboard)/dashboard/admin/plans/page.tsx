import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/dashboard/page-header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/admin/ui'
import { Package } from 'lucide-react'
import { PlansManager } from './plans-manager'
import type { PlanRow } from '../actions'

export const metadata = { title: 'Plans · Admin · SoftWindow' }

export default async function AdminPlansPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('plans')
    .select(
      'id, name, description, price, billing_interval, quotation_limit, can_access_designs, can_access_billing, can_access_inventory, is_active, is_public, sort_order, created_at'
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Plans"
        description="Define your plan catalog once. Visitors pick these at signup."
      />
      {(plans ?? []).length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={Package}
            title="No plans yet"
            description="Create your first plan so visitors can choose it when signing up."
          />
          <div className="px-6 pb-6">
            <PlansManager plans={[]} />
          </div>
        </Card>
      ) : (
        <PlansManager plans={(plans ?? []) as PlanRow[]} />
      )}
    </div>
  )
}
