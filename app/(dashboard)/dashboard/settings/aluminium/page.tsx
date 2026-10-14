import { PageHeader } from '@/components/dashboard/page-header'
import { AluminiumCostManager } from '@/components/settings/aluminium-cost-manager'
import { AccessoriesManager } from '@/components/settings/accessories-manager'

export const metadata = { title: 'Aluminium Settings · SoftWindow' }

export default function AluminiumSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Aluminium Setting"
        description="Cost heads and accessories used to price each window section."
      />

      <AluminiumCostManager />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-heading">Accessories</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Options available when configuring a section in the design editor.
        </p>
        <AccessoriesManager />
      </div>
    </div>
  )
}
