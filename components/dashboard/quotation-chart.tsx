'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuotationChartProps {
  data: {
    month: string
    count: number
  }[]
}

// Recharts pulls in a large client-only module graph that must not be
// instantiated during the server render. Loading the chart via a dynamic
// import with ssr:false keeps those chunks on the client only.
const QuotationChartInner = dynamic(() => import('./quotation-chart-inner'), {
  ssr: false,
  loading: () => (
    <Card>
      <CardHeader>
        <CardTitle>Quotation Activity — Last 7 months</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] animate-pulse rounded-lg bg-muted/40" />
      </CardContent>
    </Card>
  ),
})

export function QuotationChart({ data }: QuotationChartProps) {
  return <QuotationChartInner data={data} />
}
