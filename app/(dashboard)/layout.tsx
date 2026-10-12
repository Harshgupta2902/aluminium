import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/*
          The session read happens at request time, so it can't be
          prerendered into the static shell. Stream the header (which
          depends on the authenticated profile) in behind a Suspense
          boundary. The sidebar and chrome prerender instantly.
        */}
        <Suspense fallback={<Header />}>
          <AuthenticatedHeader />
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

async function AuthenticatedHeader() {
  // The Supabase SSR client validates the session token against the current
  // time (Date.now()), which is synchronous request-time IO. connection()
  // stops prerendering here so this only runs once a real request arrives.
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <Header user={profile || undefined} />
}
