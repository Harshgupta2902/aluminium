import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  trend?: 'up' | 'down'
}

export function StatCard({ title, value, change, changeLabel, icon: Icon, trend }: StatCardProps) {
  const isPositive = trend === 'up' || (change && change > 0)
  
  return (
    <Card className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {change !== undefined && (
              <p className="mt-3 flex items-center gap-1.5 text-sm">
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isPositive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                  }`}
                >
                  <span>{isPositive ? '↑' : '↓'}</span>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground">{changeLabel}</span>
                )}
              </p>
            )}
          </div>
          {Icon && (
            <div className="ml-4">
              <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-3 ring-1 ring-inset ring-indigo-500/15 transition-transform duration-200 group-hover:scale-105">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
