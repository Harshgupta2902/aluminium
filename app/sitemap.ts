import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * Sitemap for the public surface only. Authenticated/dynamic areas
 * (dashboard, design, auth) are intentionally excluded and disallowed in
 * robots.ts.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const routes: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }> = [
    { path: '/', changeFrequency: 'monthly', priority: 1 },
    // Documentation
    { path: '/docs', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/docs/getting-started', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/docs/designing-windows', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/docs/quotations', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/docs/pdf-proposals', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/docs/settings', changeFrequency: 'monthly', priority: 0.7 },
    // Legal
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  ]

  return Promise.all(
    routes.map(async ({ path, changeFrequency, priority }) => ({
      url: await absoluteUrl(path),
      lastModified,
      changeFrequency,
      priority,
    }))
  )
}
