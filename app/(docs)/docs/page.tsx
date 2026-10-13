import type { Metadata } from 'next'
import Link from 'next/link'
import { DocCallout } from '@/components/docs/doc-content'
import { DOCS_NAV } from '@/components/docs/docs-nav'
import {
  PanelsTopLeft,
  FileText,
  Settings,
  Rocket,
  BookOpen,
  ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation · SoftWindow',
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '/docs': BookOpen,
  '/docs/getting-started': Rocket,
  '/docs/designing-windows': PanelsTopLeft,
  '/docs/quotations': FileText,
  '/docs/pdf-proposals': FileText,
  '/docs/settings': Settings,
}

export default function DocsIndexPage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary-soft to-card p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-primary">
          <BookOpen className="h-3.5 w-3.5" />
          Documentation
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
          Learn SoftWindow
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          Design windows, build quotations, and send branded PDF proposals. These
          guides take you from your first sketch to a sent proposal.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-primary)] transition-colors hover:bg-primary-hover"
          >
            <Rocket className="h-4 w-4" />
            Quick start
          </Link>
          <Link
            href="/docs/designing-windows"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Designing windows
          </Link>
        </div>
      </div>

      {/* Section groups */}
      <div className="mt-10 space-y-10">
        {DOCS_NAV.map((section) => (
          <section key={section.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {section.links
                .filter((l) => l.href !== '/docs')
                .map((link) => {
                  const Icon = ICONS[link.href] ?? FileText
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-md)]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-heading">
                        {link.title}
                        <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                      </p>
                      {link.description && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {link.description}
                        </p>
                      )}
                    </Link>
                  )
                })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <DocCallout type="tip">
          Prefer to dive in? Create your account and the editor will guide you —
          then come back here whenever you need a reference.
        </DocCallout>
      </div>
    </div>
  )
}
