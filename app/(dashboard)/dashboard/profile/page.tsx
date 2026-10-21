import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/dashboard/page-header'
import { ProfileManager, type ProfileData } from '@/components/dashboard/profile-manager'

export const metadata = { title: 'My Profile · SoftWindow' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, company_name, phone, role, created_at')
    .eq('id', user.id)
    .single()

  if (!data) redirect('/dashboard')

  return (
    <div className="space-y-4">
      <PageHeader title="My Profile" description="View and update your account details." />
      <ProfileManager profile={data as ProfileData} />
    </div>
  )
}
