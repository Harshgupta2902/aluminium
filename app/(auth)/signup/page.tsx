import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignupForm, type PublicPlan } from './signup-form'

export const metadata = {
  title: 'Create your account · SoftWindow',
}

/**
 * Public self-service signup. Loads the active, public plan catalog and renders
 * the registration form with a plan picker. On submit, a pending-review account
 * + a sales lead are created (see ./actions.ts). The superadmin then processes
 * the lead, generates billing and activates the account.
 */
export default async function SignupPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('plans')
    .select('id, name, description, price, billing_interval, quotation_limit')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('sort_order', { ascending: true })

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

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-heading">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick a plan to get started. Our team will review your request and
          activate your account.
        </p>
      </div>

      <SignupForm plans={(plans ?? []) as PublicPlan[]} />

      <div className="mt-6 space-y-4 text-center">
        <div className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-hover hover:underline"
          >
            Log in
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Helpline: 879475061, 8826619980
        </p>
      </div>
    </AuthShell>
  )
}
