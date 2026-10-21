import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAccessState, isSuperadmin } from '@/lib/access'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { PendingDashboard } from '@/components/dashboard/pending-dashboard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const access = await getAccessState(supabase, user.id)

  // Accounts awaiting review can log in but are LOCKED to a pending view. We
  // render it here for EVERY dashboard route, so direct-URL navigation (e.g.
  // /dashboard/quotations/new) still only shows the pending screen — the real
  // page `children` are never rendered. Server actions are independently
  // guarded by requireActiveAccount().
  if (access.pendingReview) {
    const profile = access.profile
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isSuperadmin={false}
          pendingReview
          canAccessDesigns={false}
          canAccessBilling={false}
          canAccessInventory={false}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header user={profile || undefined} />
          <main className="flex-1 overflow-y-auto bg-background px-4 pb-6 pt-5">
            <PendingDashboard
              fullName={profile?.full_name ?? ''}
              email={profile?.email ?? user.email ?? ''}
            />
          </main>
        </div>
      </div>
    )
  }

  // Hard-locked accounts (inactive / expired / rejected) never reach the app.
  if (!access.allowed) {
    redirect(`/account-inactive?reason=${access.reason}`)
  }

  const profile = access.profile
  const superadmin = isSuperadmin(profile)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isSuperadmin={superadmin}
        canAccessDesigns={superadmin || profile?.can_access_designs !== false}
        canAccessBilling={superadmin || profile?.can_access_billing !== false}
        canAccessInventory={superadmin || profile?.can_access_inventory !== false}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={profile || undefined} />
        <main className="flex-1 overflow-y-auto bg-background px-4 pb-6 pt-5">
          {children}
        </main>
      </div>
    </div>
  )
}
