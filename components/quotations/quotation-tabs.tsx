'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tags, PencilRuler } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Pricing / Overview sub-nav for a quotation, mirroring the reference tabs. */
export function QuotationTabs({ quotationId }: { quotationId: string }) {
  const pathname = usePathname()
  const base = `/dashboard/quotations/${quotationId}`

  const tabs = [
    { href: base, label: 'Overview', icon: PencilRuler, exact: true },
    { href: `${base}/pricing`, label: 'Pricing', icon: Tags, exact: false },
  ]

  return (
    <div className="flex items-center gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href)
        const Icon = t.icon
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
