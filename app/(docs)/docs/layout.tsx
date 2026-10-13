import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DocsSidebar } from '@/components/docs/docs-sidebar'
import { DocsMobileNav } from '@/components/docs/docs-mobile-nav'
import { DocsToc } from '@/components/docs/docs-toc'

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <DocsMobileNav />
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-[var(--shadow-primary)]">
                S
              </span>
              <span className="text-lg font-semibold tracking-tight text-heading">
                SoftWindow
              </span>
            </Link>
            <span className="hidden rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline">
              Docs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-10 sm:px-6 xl:gap-12">
        {/* Left sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8">
            <DocsSidebar />
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>

        {/* Right rail: on this page */}
        <aside className="hidden w-56 shrink-0 xl:block">
          <div className="sticky top-24">
            <DocsToc />
          </div>
        </aside>
      </div>
    </div>
  )
}
