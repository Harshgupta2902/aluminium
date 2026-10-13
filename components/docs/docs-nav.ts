/** Documentation navigation structure, shared by the sidebar, breadcrumbs and prev/next. */
export interface DocLink {
  title: string
  href: string
  /** Short description used on the index cards. */
  description?: string
}

export interface DocSection {
  title: string
  links: DocLink[]
}

export const DOCS_NAV: DocSection[] = [
  {
    title: 'Getting Started',
    links: [
      {
        title: 'Introduction',
        href: '/docs',
        description: 'What SoftWindow does and how the docs are organised.',
      },
      {
        title: 'Quick start',
        href: '/docs/getting-started',
        description: 'From sign-up to your first sent quotation.',
      },
    ],
  },
  {
    title: 'Guides',
    links: [
      {
        title: 'Designing windows',
        href: '/docs/designing-windows',
        description: 'Frames, sections, couplers, mullions and window types.',
      },
      {
        title: 'Building quotations',
        href: '/docs/quotations',
        description: 'Add designs, reuse the catalogue, and read totals.',
      },
      {
        title: 'PDF proposals',
        href: '/docs/pdf-proposals',
        description: 'Generate and share a branded proposal.',
      },
      {
        title: 'Settings & catalog',
        href: '/docs/settings',
        description: 'Manage glass, colours, hardware and pricing.',
      },
    ],
  },
]

/** Flattened list, in nav order, for prev/next navigation. */
export const DOCS_FLAT: DocLink[] = DOCS_NAV.flatMap((s) => s.links)

export function adjacentDocs(href: string): {
  prev: DocLink | null
  next: DocLink | null
} {
  const i = DOCS_FLAT.findIndex((l) => l.href === href)
  if (i === -1) return { prev: null, next: null }
  return {
    prev: i > 0 ? DOCS_FLAT[i - 1] : null,
    next: i < DOCS_FLAT.length - 1 ? DOCS_FLAT[i + 1] : null,
  }
}

/** Resolve the section a page belongs to (for breadcrumbs). */
export function sectionFor(href: string): DocSection | null {
  return DOCS_NAV.find((s) => s.links.some((l) => l.href === href)) ?? null
}

export function docLinkFor(href: string): DocLink | null {
  return DOCS_FLAT.find((l) => l.href === href) ?? null
}
