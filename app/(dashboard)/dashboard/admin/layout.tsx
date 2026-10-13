import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Superadmin-only area. The middleware already gates /dashboard/admin, and the
 * dashboard layout gates the account — this is the final server-side check.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/dashboard')

  return <>{children}</>
}
