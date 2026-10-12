import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

// The entire dashboard is per-user, request-time UI (session + live data),
// so it is allowed to block rather than prerender a static shell. This opts
// the layout and every page beneath it out of Cache Components' instant /
// static-shell validation.
export const instant = false

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The whole dashboard is per-user, request-time UI. Take a dynamic
  // dependency up front so the session read never lands in the static shell.
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={profile || undefined} />
        <main className="flex-1 overflow-y-auto bg-background px-4 pb-6 pt-5">
          {children}
        </main>
      </div>
    </div>
  )
}
