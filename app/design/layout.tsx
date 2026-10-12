import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DesignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The session read (token time-check + cookies) is request-time work.
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
