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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <p className={`mt-2 text-sm flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <span>{isPositive ? '↑' : '↓'}</span>
                <span className="ml-1">
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="ml-1 text-gray-500">{changeLabel}</span>
                )}
              </p>
            )}
          </div>
          {Icon && (
            <div className="ml-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
