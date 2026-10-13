'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Heading {
  id: string
  text: string
}

/**
 * "On this page" table of contents. Reads the h2[data-toc] headings rendered
 * by DocH2 inside the article and highlights the active one on scroll.
 */
export function DocsToc() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    let observer: IntersectionObserver | null = null

    // Read headings after paint so the article is fully rendered.
    const raf = requestAnimationFrame(() => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>('h2[data-toc]')
      ).filter((n) => n.id)

      setHeadings(nodes.map((n) => ({ id: n.id, text: n.textContent ?? '' })))
      if (nodes.length > 0) setActiveId(nodes[0].id)
      if (nodes.length === 0) return

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          if (visible[0]) setActiveId(visible[0].target.id)
        },
        { rootMargin: '-96px 0px -70% 0px', threshold: [0, 1] }
      )
      nodes.forEach((n) => observer!.observe(n))
    })

    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [])

  if (headings.length === 0) return null

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                '-ml-px block border-l-2 py-1 pl-3 text-sm transition-colors',
                activeId === h.id
                  ? 'border-primary font-medium text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
