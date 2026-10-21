import { PageHeader } from '@/components/dashboard/page-header'
import { Card } from '@/components/ui/card'
import { AdminStat, EmptyState } from '@/components/admin/ui'
import { UserPlus, Inbox, PhoneCall, Send, CheckCircle2 } from 'lucide-react'
import { loadLeads } from '../data'
import { LeadsTable } from './leads-table'

export const metadata = { title: 'Leads · Admin · SoftWindow' }

export default async function AdminLeadsPage() {
  const leads = await loadLeads()

  const counts = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted' || l.status === 'billing_sent').length,
    won: leads.filter((l) => l.status === 'won').length,
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leads"
        description="Self-signup requests. Contact, generate billing, then mark paid to activate."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStat label="Total leads" value={counts.total} icon={Inbox} tone="primary" />
        <AdminStat label="New" value={counts.new} icon={UserPlus} tone="violet" />
        <AdminStat label="In progress" value={counts.contacted} icon={Send} tone="amber" />
        <AdminStat label="Won" value={counts.won} icon={CheckCircle2} tone="emerald" />
      </div>

      {leads.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={PhoneCall}
            title="No leads yet"
            description="When visitors sign up and pick a plan, they'll appear here for you to process."
          />
        </Card>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  )
}
