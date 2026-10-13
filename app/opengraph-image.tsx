import { ImageResponse } from 'next/og'
import { siteName } from '@/lib/site'

// Route segment / image metadata
export const alt = `${siteName} — Design windows and send quotations in minutes`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Branded social-share image for the public surface. Rendered with next/og
 * (Satori), so only a subset of CSS is supported — layout uses flexbox and
 * inline styles, and all colours are literal (no CSS variables / Tailwind).
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background:
            'linear-gradient(135deg, #0f1e40 0%, #1e3a8a 45%, #2f6bff 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '84px',
              height: '84px',
              borderRadius: '20px',
              background: '#ffffff',
              color: '#2f6bff',
              fontSize: '52px',
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ fontSize: '40px', fontWeight: 600, letterSpacing: '-1px' }}>
            {siteName}
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-2px',
              maxWidth: '960px',
            }}
          >
            Design windows and send quotations in minutes
          </div>
          <div
            style={{
              fontSize: '30px',
              color: 'rgba(255,255,255,0.82)',
              maxWidth: '880px',
              lineHeight: 1.4,
            }}
          >
            Draw aluminium &amp; uPVC windows, price them automatically, and
            share branded PDF proposals.
          </div>
        </div>

        {/* Footer chips */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {['20+ window types', 'Automatic pricing', 'PDF proposals'].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 22px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: '24px',
                fontWeight: 500,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
