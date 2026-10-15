import { PageHeader } from '@/components/dashboard/page-header'
import { ListManager } from '@/components/settings/list-manager'

export const metadata = { title: 'Glass · SoftWindow' }

export default function GlassSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Glass"
        description="Glass types and their rate per sq.ft used in the design editor."
      />
      <ListManager
        table="design_glasses"
        title="Glass Types"
        extraColumn="rate_per_sqft"
        extraLabel="₹/sqft"
      />
    </div>
  )
}
