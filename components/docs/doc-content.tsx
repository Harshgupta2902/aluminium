import Link from 'next/link'
import type { ReactNode } from 'react'
import { Info, Lightbulb, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react'
import { adjacentDocs, sectionFor } from './docs-nav'
import { slugify, textOf } from './slug'

/** Page wrapper: breadcrumb, title, lead paragraph, body, and prev/next footer. */
export function DocPage({
  title,
  lead,
  href,
  children,
}: {
  title: string
  lead?: string
  href: string
  children: ReactNode
}) {
  const { prev, next } = adjacentDocs(href)
  const section = sectionFor(href)
  const isIndex = href === '/docs'

  return (
    <article>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/docs" className="hover:text-foreground">Docs</Link>
        {!isIndex && section && (
          <>
            <span className="text-border-strong">/</span>
            <span>{section.title}</span>
            <span className="text-border-strong">/</span>
            <span className="text-foreground">{title}</span>
          </>
        )}
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        {title}
      </h1>
      {lead && (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{lead}</p>
      )}
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        {children}
      </div>

      {(prev || next) && (
        <div className="mt-12 flex items-center justify-between gap-3 border-t border-border pt-6">
          {prev ? (
            <Link
              href={prev.href}
              className="group flex flex-col items-start rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </span>
              <span className="mt-0.5 text-sm font-medium text-heading group-hover:text-primary">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={next.href}
              className="group flex flex-col items-end rounded-lg border border-border px-4 py-3 text-right transition-colors hover:border-primary"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <span className="mt-0.5 text-sm font-medium text-heading group-hover:text-primary">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </article>
  )
}

export function DocH2({ children }: { children: ReactNode }) {
  const id = slugify(textOf(children))
  return (
    <h2
      id={id}
      data-toc
      className="group scroll-mt-24 pt-2 text-xl font-semibold tracking-tight text-heading"
    >
      <a href={`#${id}`} className="relative">
        {children}
        <span className="ml-2 text-primary opacity-0 transition-opacity group-hover:opacity-100">
          #
        </span>
      </a>
    </h2>
  )
}

export function DocP({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>
}

export function DocUL({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground marker:text-primary">
      {children}
    </ul>
  )
}

/** Numbered steps with a styled index badge. */
export function DocSteps({ steps }: { steps: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {i + 1}
          </span>
          <div className="pt-0.5">
            <p className="font-medium text-heading">{s.title}</p>
            <div className="mt-0.5 text-muted-foreground">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

const CALLOUT = {
  note: {
    icon: Info,
    box: 'border-sky-200 bg-sky-50 dark:border-sky-500/20 dark:bg-sky-500/10',
    icon_cls: 'text-sky-600 dark:text-sky-400',
    text: 'text-sky-700 dark:text-sky-300',
  },
  tip: {
    icon: Lightbulb,
    box: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10',
    icon_cls: 'text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    icon: AlertTriangle,
    box: 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10',
    icon_cls: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-300',
  },
}

export function DocCallout({
  type = 'note',
  children,
}: {
  type?: 'note' | 'tip' | 'warning'
  children: ReactNode
}) {
  const { icon: Icon, box, icon_cls, text } = CALLOUT[type]
  return (
    <div className={`flex gap-3 rounded-lg border p-4 text-sm ${box}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${icon_cls}`} />
      <div className={`font-medium leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_p]:m-0 ${text}`}>
        {children}
      </div>
    </div>
  )
}

/** Inline key / UI label. */
export function DocKbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.8em] font-medium text-heading">
      {children}
    </kbd>
  )
}
