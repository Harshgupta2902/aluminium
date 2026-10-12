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
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-heading">{value}</p>
            {change !== undefined && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${
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
            {change === undefined && changeLabel && (
              <p className="mt-1.5 text-xs text-muted-foreground">{changeLabel}</p>
            )}
          </div>
          {Icon && (
            <div className="rounded-lg bg-primary-soft p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
