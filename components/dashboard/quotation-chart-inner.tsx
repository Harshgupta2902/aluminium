'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface QuotationChartProps {
  data: {
    month: string
    count: number
  }[]
}

export default function QuotationChartInner({ data }: QuotationChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotation Activity — Last 7 months</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="quotationFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7367f0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7367f0" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.625rem',
                  boxShadow: 'var(--shadow-md)',
                  color: 'var(--foreground)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 500 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#7367f0"
                strokeWidth={2.5}
                fill="url(#quotationFill)"
                dot={{ fill: '#7367f0', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--card)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
