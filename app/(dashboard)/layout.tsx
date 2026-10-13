import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAccessState, isSuperadmin } from '@/lib/access'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

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

  // Blocked accounts (inactive / expired) never reach the app.
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
