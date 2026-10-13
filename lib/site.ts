/**
 * Central place for public site metadata used across SEO surfaces
 * (robots, sitemap, Open Graph, Twitter cards, canonical URLs).
 */

import { headers } from 'next/headers'

/** Human-facing product name, reused in titles and OG tags. */
export const siteName = 'SoftWindow'

/** Default description for the public marketing surface. */
export const siteDescription =
  'Design aluminium & uPVC windows section by section, price them automatically, and send branded PDF proposals to your clients — all from one simple workspace.'

/**
 * Resolve the site's base URL from the incoming request at runtime.
 *
 * Derived from the request `host` header (and `x-forwarded-proto`) so it always
 * matches whatever domain the app is deployed on — no env var or hardcoded
 * domain to keep in sync across deployments. Falls back to localhost when no
 * request context is available (e.g. during build). No trailing slash.
 */
export async function getSiteUrl(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    if (host) {
      const proto =
        h.get('x-forwarded-proto') ??
        (host.startsWith('localhost') || host.startsWith('127.0.0.1')
          ? 'http'
          : 'https')
      return `${proto}://${host}`.replace(/\/+$/, '')
    }
  } catch {
    // headers() throws outside a request scope (e.g. at build time).
  }
  return 'http://localhost:3000'
}

/** Build an absolute URL for a given path (e.g. `/docs`) from the request host. */
export async function absoluteUrl(path = '/'): Promise<string> {
  const base = await getSiteUrl()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
