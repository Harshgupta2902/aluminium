'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SlidersHorizontal,
  LayoutGrid,
  Users,
  Plug,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsNavItem {
  href: string
  label: string
  description: string
  icon: LucideIcon
  disabled?: boolean
}

const SETTINGS_NAV: SettingsNavItem[] = [
  {
    href: '/dashboard/settings/aluminium',
    label: 'Aluminium Setting',
    description: 'Cost heads & accessories',
    icon: SlidersHorizontal,
  },
  {
    href: '/dashboard/settings/design-catalog',
    label: 'Catalog & Pricing',
    description: 'Glass, colours, hardware, rates',
    icon: LayoutGrid,
  },
  {
    href: '/dashboard/settings/users',
    label: 'User Management',
    description: 'Users and roles',
    icon: Users,
    disabled: true,
  },
  {
    href: '/dashboard/settings/integrations',
    label: 'Integrations',
    description: 'WhatsApp & more',
    icon: Plug,
    disabled: true,
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold leading-tight text-heading">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your application preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Nested sub-nav */}
        <nav className="shrink-0 lg:w-64">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
            {SETTINGS_NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon

              if (item.disabled) {
                return (
                  <li key={item.href}>
                    <span
                      className="flex cursor-not-allowed items-start gap-3 rounded-lg px-3 py-2.5 opacity-50"
                      title="Coming soon"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block whitespace-nowrap text-sm font-medium text-heading">
                          {item.label}
                        </span>
                        <span className="hidden text-xs text-muted-foreground lg:block">
                          {item.description}
                        </span>
                      </span>
                    </span>
                  </li>
                )
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                      active
                        ? 'bg-primary text-white'
                        : 'text-heading hover:bg-primary-soft/40'
                    )}
                  >
                    <Icon
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        active ? 'text-white' : 'text-muted-foreground'
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap text-sm font-medium">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          'hidden text-xs lg:block',
                          active ? 'text-white/80' : 'text-muted-foreground'
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Active section content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
