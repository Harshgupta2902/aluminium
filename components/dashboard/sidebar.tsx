'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Palette,
  Package,
  Receipt,
  Users,
  Settings,
  ShieldCheck,
  ShieldHalf,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  /** Key of the access prop that gates this item (undefined = always shown). */
  gate?: 'designs' | 'billing' | 'inventory'
}

// Regular user navigation.
const USER_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quotations', href: '/dashboard/quotations', icon: FileText },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package, gate: 'inventory' },
  { name: 'Billing', href: '/dashboard/billing', icon: Receipt, gate: 'billing' },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

// Superadmin navigation — a dedicated admin console, nothing else.
const ADMIN_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/dashboard/admin/users', icon: Users },
  { name: 'User permissions', href: '/dashboard/admin/permissions', icon: ShieldHalf },
  { name: 'Billings', href: '/dashboard/admin/billing', icon: CreditCard },
]

export function Sidebar({
  isSuperadmin = false,
  canAccessDesigns = true,
  canAccessBilling = true,
  canAccessInventory = true,
}: {
  isSuperadmin?: boolean
  canAccessDesigns?: boolean
  canAccessBilling?: boolean
  canAccessInventory?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visible = isSuperadmin
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
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visible.map((item) => {
          const isActive =
            item.href === '/dashboard' || item.href === '/dashboard/admin'
              ? pathname === item.href
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
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
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground group-hover:text-primary'
                )}
              />
              {item.name}
            </Link>
          )
        })}
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
