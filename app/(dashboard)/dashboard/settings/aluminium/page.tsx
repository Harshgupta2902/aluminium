import { PageHeader } from '@/components/dashboard/page-header'
import { AluminiumCostManager } from '@/components/settings/aluminium-cost-manager'

export const metadata = { title: 'Aluminium Setting · SoftWindow' }

export default function AluminiumSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Aluminium Setting"
        description="Cost heads used to price each window section."
      />
      <AluminiumCostManager />
    </div>
  )
}
