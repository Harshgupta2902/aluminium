import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// This whole subtree reads the session and live data at request time, so it
// is allowed to block (it is not meant to be a prerendered static shell).
// `instant = false` opts the layout and everything under it out of Cache
// Components' instant-navigation / static-shell validation.
export const instant = false

export default async function DesignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Per-user, request-time subtree: take a dynamic dependency up front so the
  // session read never gets folded into the static shell during prerender.
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
