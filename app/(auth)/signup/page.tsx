import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthShell } from '@/components/auth/auth-shell'
import { ShieldCheck, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Request access · SoftWindow',
}

/**
 * Public self-signup is disabled — accounts are created by an administrator.
 * (The middleware also redirects /signup, so this is a graceful fallback.)
 */
export default function SignupPage() {
  return (
    <AuthShell>
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-[var(--shadow-primary)]">
          S
        </span>
        <span className="text-lg font-semibold tracking-tight text-heading">
          SoftWindow
        </span>
      </div>

      <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <ShieldCheck className="h-6 w-6" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-heading">
        Accounts are created by your administrator
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        SoftWindow accounts are set up for you. Contact your administrator to get
        an account — you&apos;ll receive your login details by email. Already have
        an account? Just log in.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <Link href="/login">
          <Button size="lg" className="w-full">
            Go to login
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Helpline: 879475061, 8826619980
      </p>
    </AuthShell>
  )
}
