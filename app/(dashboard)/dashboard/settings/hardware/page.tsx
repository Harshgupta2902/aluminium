import { PageHeader } from '@/components/dashboard/page-header'
import { AccessoriesManager } from '@/components/settings/accessories-manager'

export const metadata = { title: 'Aluminium Hardware · SoftWindow' }

export default function AluminiumHardwarePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Aluminium Hardware"
        description="Handles, sashes, locks, rollers, hinges, mesh parts and common consumables available when configuring a window section."
      />
      <AccessoriesManager />
    </div>
  )
}
