import { PageHeader } from '@/components/dashboard/page-header'
import { SeriesManager } from '@/components/settings/series-manager'

export const metadata = { title: 'Aluminium Coating · SoftWindow' }

export default function AluminiumCoatingPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Aluminium Coating"
        description="Profile companies and series, their available stock lengths, and the series-scoped profiles (tracks, sashes, interlocks…) used by the design editor."
      />
      <SeriesManager />
    </div>
  )
}
