import { ListManager } from '@/components/settings/list-manager'
import { PricingManager } from '@/components/settings/pricing-manager'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DesignCatalogSettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Design Catalog"
        description="Manage the glass, colour and hardware options plus pricing used by the design editor."
      >
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListManager table="design_glasses" title="Glass Types" extraColumn="rate_per_sqft" extraLabel="₹/sqft" />
        <ListManager table="design_colors" title="Colours" extraColumn="hex" extraLabel="#hex" />
        <ListManager table="gi_tracks" title="GI Tracks" extraColumn="profile_code" extraLabel="Code" />
        <ListManager table="gi_sashes" title="GI Sashes" extraColumn="profile_code" extraLabel="Code" />
        <ListManager table="gi_interlocks" title="GI Interlocks" extraColumn="profile_code" extraLabel="Code" />
        <ListManager table="gi_locks" title="GI Locks" extraColumn="profile_code" extraLabel="Code" />
      </div>

      <PricingManager />
    </div>
  )
}
