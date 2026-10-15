import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Home, LayoutDashboard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-center">
      {/* Soft background accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-10 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Window illustration */}
        <WindowGlyph />

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Error 404
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-heading sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Let&apos;s get you back on track.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto cursor-pointer">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline" className="w-full sm:w-auto cursor-pointer">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

/** A friendly aluminium-window glyph with a big 404 in the glass. */
function WindowGlyph() {
  return (
    <div className="relative">
      <svg
        width="150"
        height="150"
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
        aria-hidden
      >
        {/* Outer frame */}
        <rect
          x="18"
          y="18"
          width="114"
          height="114"
          rx="10"
          className="fill-card"
          stroke="currentColor"
          strokeWidth="4"
          style={{ color: 'var(--color-primary)' }}
        />
        {/* Glass panes */}
        <rect x="30" y="30" width="40" height="40" rx="3" className="fill-primary/10" />
        <rect x="80" y="30" width="40" height="40" rx="3" className="fill-primary/10" />
        <rect x="30" y="80" width="40" height="40" rx="3" className="fill-primary/10" />
        <rect x="80" y="80" width="40" height="40" rx="3" className="fill-primary/10" />
        {/* Mullions */}
        <line x1="75" y1="22" x2="75" y2="128" stroke="currentColor" strokeWidth="4" style={{ color: 'var(--color-primary)' }} />
        <line x1="22" y1="75" x2="128" y2="75" stroke="currentColor" strokeWidth="4" style={{ color: 'var(--color-primary)' }} />
      </svg>
    </div>
  )
}
