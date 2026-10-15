'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tags, PencilRuler, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Pricing / Overview sub-nav for a quotation, mirroring the reference tabs. */
export function QuotationTabs({ quotationId }: { quotationId: string }) {
  const pathname = usePathname()
  const base = `/dashboard/quotations/${quotationId}`

  const tabs = [
    { href: base, label: 'Overview', icon: PencilRuler, exact: true },
    { href: `${base}/pricing`, label: 'Pricing', icon: Tags, exact: false },
    { href: `${base}/reports`, label: 'Reports', icon: BarChart3, exact: false },
  ]

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/50 p-1">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href)
        const Icon = t.icon
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-card text-primary shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
