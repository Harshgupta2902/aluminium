'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Palette,
  Receipt,
  Users,
  Settings,
  SlidersHorizontal,
  LayoutGrid,
  Layers,
  Wrench,
  GlassWater,
  ShieldCheck,
  ShieldHalf,
  CreditCard,
  ScrollText,
  UserPlus,
  Package,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logAuthEvent } from '@/app/(auth)/audit-actions'

interface NavChild {
  name: string
  href: string
  icon: typeof LayoutDashboard
}

interface NavItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  /** Key of the access prop that gates this item (undefined = always shown). */
  gate?: 'designs' | 'billing' | 'inventory'
  /** Optional collapsible sub-items (rendered as a dropdown). */
  children?: NavChild[]
}

// Settings sub-items (shown as a collapsible dropdown under "Settings").
const SETTINGS_CHILDREN: NavChild[] = [
  { name: 'Aluminium Setting', href: '/dashboard/settings/aluminium', icon: SlidersHorizontal },
  { name: 'Aluminium Hardware', href: '/dashboard/settings/hardware', icon: Wrench },
  { name: 'Aluminium Coating', href: '/dashboard/settings/coating', icon: Layers },
  { name: 'Glass', href: '/dashboard/settings/glass', icon: GlassWater },
  { name: 'Colours & Pricing', href: '/dashboard/settings/design-catalog', icon: LayoutGrid },
]

// Regular user navigation.
const USER_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quotations', href: '/dashboard/quotations', icon: FileText },
  { name: 'Billing', href: '/dashboard/billing', icon: Receipt, gate: 'billing' },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, children: SETTINGS_CHILDREN },
]

// Superadmin navigation — a dedicated admin console, nothing else.
const ADMIN_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Leads', href: '/dashboard/admin/leads', icon: UserPlus },
  { name: 'Users', href: '/dashboard/admin/users', icon: Users },
  { name: 'Plans', href: '/dashboard/admin/plans', icon: Package },
  { name: 'User permissions', href: '/dashboard/admin/permissions', icon: ShieldHalf },
  { name: 'Billings', href: '/dashboard/admin/billing', icon: CreditCard },
  { name: 'Audit Logs', href: '/dashboard/admin/audit', icon: ScrollText },
]

export function Sidebar({
  isSuperadmin = false,
  pendingReview = false,
  canAccessDesigns = true,
  canAccessBilling = true,
  canAccessInventory = true,
}: {
  isSuperadmin?: boolean
  pendingReview?: boolean
  canAccessDesigns?: boolean
  canAccessBilling?: boolean
  canAccessInventory?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await logAuthEvent('logout').catch(() => {})
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visible = pendingReview
    ? [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard } as NavItem]
    : isSuperadmin
      ? ADMIN_NAV
      : USER_NAV.filter((item) => {
          switch (item.gate) {
            case 'designs':
              return canAccessDesigns
            case 'billing':
              return canAccessBilling
            case 'inventory':
              return canAccessInventory
            default:
              return true
          }
        })

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg shadow-[var(--shadow-primary)]',
            isSuperadmin ? 'bg-gray-900' : 'bg-primary'
          )}
        >
          {isSuperadmin ? (
            <ShieldCheck className="h-5 w-5 text-white" />
          ) : (
            <Palette className="h-5 w-5 text-white" />
          )}
        </div>
        <div className="leading-tight">
          <h1 className="text-lg font-bold tracking-tight text-heading">Soft Window</h1>
          {isSuperadmin && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Admin Console
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visible.map((item) =>
          item.children ? (
            <NavGroup key={item.name} item={item} pathname={pathname} />
          ) : (
            <NavLink key={item.name} item={item} pathname={pathname} />
          )
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}

/** A single top-level nav link (no children). */
function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href === '/dashboard' || item.href === '/dashboard/admin'
      ? pathname === item.href
      : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground shadow-[var(--shadow-primary)]'
          : 'text-foreground hover:bg-primary-soft hover:text-primary'
      )}
    >
      <item.icon
        className={cn(
          'h-5 w-5 transition-colors',
          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
        )}
      />
      {item.name}
    </Link>
  )
}

/** A collapsible nav group with child links (e.g. Settings). */
function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const sectionActive = pathname.startsWith(item.href)
  // Auto-expand when inside the section; otherwise remember the user's toggle.
  const [open, setOpen] = useState(sectionActive)
  const expanded = open || sectionActive

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
          sectionActive
            ? 'bg-primary-soft text-primary'
            : 'text-foreground hover:bg-primary-soft hover:text-primary'
        )}
      >
        <item.icon
          className={cn(
            'h-5 w-5 transition-colors',
            sectionActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
          )}
        />
        <span className="flex-1 text-left">{item.name}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-150', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div className="mt-1 space-y-0.5 pl-4">
          {item.children!.map((child) => {
            const childActive =
              pathname === child.href || pathname.startsWith(child.href + '/')
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150',
                  childActive
                    ? 'bg-gradient-to-r from-primary to-primary-hover font-medium text-primary-foreground shadow-[var(--shadow-primary)]'
                    : 'text-muted-foreground hover:bg-primary-soft hover:text-primary'
                )}
              >
                <child.icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    childActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                  )}
                />
                {child.name}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
