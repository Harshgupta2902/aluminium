import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * robots.txt — allow crawling of the public marketing/docs surface, but keep
 * authenticated and dynamic app areas out of search indexes.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard', // authenticated app
        '/design', // design renderer (per-quotation, dynamic)
        '/login',
        '/signup',
        '/forgot-password',
        '/api', // API routes
      ],
    },
    sitemap: await absoluteUrl('/sitemap.xml'),
    host: await absoluteUrl('/'),
  }
}
