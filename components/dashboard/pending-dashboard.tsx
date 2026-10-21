import { Card } from '@/components/ui/card'
import { Clock, Mail, PhoneCall, CheckCircle2 } from 'lucide-react'

/**
 * The only screen a 'pending_review' account can see. Shown for every dashboard
 * route so URL navigation can't reveal real pages. Purely informational — no
 * actions are possible until the superadmin activates the account.
 */
export function PendingDashboard({
  fullName,
  email,
}: {
  fullName: string
  email: string
}) {
  const steps = [
    { label: 'Account created', done: true },
    { label: 'Under review by our team', done: false, current: true },
    { label: 'Billing shared & payment confirmed', done: false },
    { label: 'Full access unlocked', done: false },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-3 border-b border-border bg-amber-50 px-6 py-8 text-center dark:bg-amber-500/10">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/20">
            <Clock className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-heading">
              Your account is under review
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {fullName ? `Hi ${fullName}, thanks ` : 'Thanks '}
              for signing up. Our team will verify your details and share billing
              to activate your account.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Progress steps */}
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className={
                    s.done
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : s.current
                        ? 'flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-2 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-400'
                        : 'flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground'
                  }
                >
                  {s.done ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                </span>
                <span
                  className={
                    s.current
                      ? 'text-sm font-medium text-heading'
                      : s.done
                        ? 'text-sm text-muted-foreground line-through'
                        : 'text-sm text-muted-foreground'
                  }
                >
                  {s.label}
                </span>
                {s.current && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    In progress
                  </span>
                )}
              </li>
            ))}
          </ol>

          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="mt-1 text-muted-foreground">
              You&apos;ll get an email once your account is active. Until then,
              quotations, designs and other tools are locked.
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-center sm:gap-6">
            <span className="flex items-center justify-center gap-2 text-muted-foreground">
              <PhoneCall className="h-4 w-4" /> 879475061, 8826619980
            </span>
            <span className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> support@yourdomain.com
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
