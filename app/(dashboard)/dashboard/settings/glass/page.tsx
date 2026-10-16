import { PageHeader } from '@/components/dashboard/page-header'
import { GlassManager } from '@/components/settings/glass-manager'

export const metadata = { title: 'Glass · SoftWindow' }

export default function GlassSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Glass"
        description="Glass types and their rate per sq.ft used in the design editor."
      />
      <GlassManager />
    </div>
  )
}
