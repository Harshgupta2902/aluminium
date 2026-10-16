import { PageHeader } from '@/components/dashboard/page-header'
import { CatalogManager } from '@/components/settings/catalog-manager'

export const metadata = { title: 'Colours & Pricing · SoftWindow' }

export default function DesignCatalogSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Colours & Fallback Pricing"
        description="Window colours, plus the base per-type rates used only when a design has no profile series selected (series-based designs use the weight-based BOM engine)."
      />
      <CatalogManager />
    </div>
  )
}
