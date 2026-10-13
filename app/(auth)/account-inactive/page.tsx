import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/auth/logout-button'
import { AlertTriangle, Clock, Ban } from 'lucide-react'

export const metadata = {
  title: 'Account unavailable · SoftWindow',
}

const COPY: Record<string, { icon: typeof Ban; title: string; body: string }> = {
  inactive: {
    icon: Ban,
    title: 'Your account is inactive',
    body: 'Your account has been deactivated. Please contact your administrator to regain access.',
  },
  expired: {
    icon: Clock,
    title: 'Your plan has expired',
    body: 'Your current billing period has ended. Please contact your administrator to renew and continue.',
  },
  default: {
    icon: AlertTriangle,
    title: 'Account unavailable',
    body: 'Your account cannot be accessed right now. Please contact your administrator.',
  },
}

export default async function AccountInactivePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const c = COPY[reason ?? 'default'] ?? COPY.default
  const Icon = c.icon

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-heading">{c.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>

        {user?.email && (
          <p className="mt-4 text-xs text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}

        <div className="mt-7 flex items-center justify-center gap-3">
          {user ? (
            <LogoutButton />
          ) : (
            <Link href="/login">
              <Button>Back to login</Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Need help? Helpline: 879475061, 8826619980
        </p>
      </div>
    </div>
  )
}
