import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Two-panel auth layout: a branded violet showcase on the left (hidden on
 * small screens) and the form on the right. Shared by login + signup so both
 * pages stay visually consistent.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <BrandPanel />
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="relative hidden w-[46%] max-w-[640px] shrink-0 overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-black/15 blur-3xl" />
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 p-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white ring-1 ring-white/25 backdrop-blur">
            S
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            SoftWindow
          </span>
        </Link>
      </div>

      <div className="relative z-10 px-10">
        <WindowMotif />
        <h2 className="mt-10 max-w-sm text-3xl font-bold leading-tight tracking-tight text-white">
          Design the future of windows &amp; doors
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
          Draw professional window designs, build quotations in minutes, and
          send branded PDF proposals — all in one place.
        </p>
        <ul className="mt-7 space-y-3">
          {[
            'Section-based visual window designer',
            'Automatic area &amp; pricing with GST',
            'One-click PDF proposals for clients',
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-white/85">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25">
                <svg viewBox="0 0 20 20" className="h-3 w-3 fill-white">
                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.1-.3z" />
                </svg>
              </span>
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 p-10 text-xs text-white/50">
        © {new Date().getFullYear()} SoftWindow. All rights reserved.
      </div>
    </div>
  )
}

/** A simple decorative sliding-window drawing in the brand panel. */
function WindowMotif() {
  return (
    <svg
      viewBox="0 0 220 150"
      className="h-28 w-auto drop-shadow-xl"
      role="presentation"
    >
      <rect x="4" y="4" width="212" height="142" rx="6" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.6)" strokeWidth="3" />
      <rect x="16" y="16" width="90" height="118" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
      <rect x="114" y="16" width="90" height="118" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
      <line x1="40" y1="75" x2="82" y2="75" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
      <polyline points="74,69 82,75 74,81" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
      <circle cx="24" cy="75" r="3" fill="rgba(255,255,255,0.85)" />
      <circle cx="196" cy="75" r="3" fill="rgba(255,255,255,0.85)" />
    </svg>
  )
}
