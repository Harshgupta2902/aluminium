import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  PanelsTopLeft,
  Calculator,
  FileText,
  LayoutGrid,
  Users,
  ArrowRight,
  Check,
} from 'lucide-react'

export default async function Home() {
  // Logged-in users skip the marketing page.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <Hero />
        <Features />
        <StatsStrip />
        <HowItWorks />
        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  )
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-[var(--shadow-primary)]">
            S
          </span>
          <span className="text-lg font-semibold tracking-tight text-heading">
            SoftWindow
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <Link href="/docs" className="transition-colors hover:text-foreground">Docs</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            For aluminium &amp; uPVC window businesses
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-heading sm:text-5xl">
            Design windows and send quotations in minutes
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Draw professional window designs section by section, price them
            automatically, and send branded PDF proposals to your clients — all
            from one simple workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs/getting-started">
              <Button size="lg" variant="outline">
                Getting Started Guide
              </Button>
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {['No credit card required', '20+ window types', 'PDF proposals'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                {t}
              </span>
            ))}
          </div>
        </div>

        <HeroArt />
      </div>
    </section>
  )
}

/** A decorative, realistic window-design canvas mock for the hero. */
function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* glow + floating accents */}
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/25 via-primary/5 to-transparent blur-2xl" />

      <div className="relative rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-lg)]">
        {/* window chrome */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Window Designer
          </span>
        </div>

        {/* the drawing */}
        <div className="rounded-xl bg-[#f4f6f9] p-5">
          <svg viewBox="0 0 360 260" className="w-full" role="img" aria-label="Window design preview">
            <defs>
              <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#eff6ff" />
                <stop offset="0.5" stopColor="#dbeafe" />
                <stop offset="1" stopColor="#c7dbfb" />
              </linearGradient>
              <linearGradient id="alu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#aab4c2" />
                <stop offset="0.5" stopColor="#8793a3" />
                <stop offset="1" stopColor="#6b7686" />
              </linearGradient>
              <linearGradient id="aluV" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#aab4c2" />
                <stop offset="0.5" stopColor="#8793a3" />
                <stop offset="1" stopColor="#6b7686" />
              </linearGradient>
            </defs>

            {/* outer frame with depth */}
            <rect x="14" y="14" width="332" height="232" rx="10" fill="url(#alu)" />
            <rect x="24" y="24" width="312" height="212" rx="6" fill="#ffffff" />

            {/* ---- left section: sliding, 2 panels ---- */}
            {/* panel 1 */}
            <rect x="32" y="32" width="68" height="196" rx="2" fill="url(#glass)" stroke="#9db7e0" strokeWidth="1.5" />
            <rect x="36" y="36" width="60" height="188" rx="1.5" fill="none" stroke="#b9c6d6" strokeWidth="3" />
            <line x1="46" y1="46" x2="86" y2="150" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
            {/* panel 2 */}
            <rect x="104" y="32" width="68" height="196" rx="2" fill="url(#glass)" stroke="#9db7e0" strokeWidth="1.5" />
            <rect x="108" y="36" width="60" height="188" rx="1.5" fill="none" stroke="#b9c6d6" strokeWidth="3" />
            {/* handles */}
            <rect x="92" y="118" width="4" height="24" rx="2" fill="#4b5563" />
            <rect x="108" y="118" width="4" height="24" rx="2" fill="#4b5563" />
            {/* slide arrow */}
            <line x1="60" y1="130" x2="88" y2="130" stroke="#2f6bff" strokeWidth="2.5" strokeLinecap="round" />
            <polyline points="80,123 90,130 80,137" fill="none" stroke="#2f6bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* ---- coupler divider ---- */}
            <rect x="176" y="24" width="16" height="212" fill="url(#aluV)" />

            {/* ---- right section: casement ---- */}
            <rect x="196" y="32" width="140" height="196" rx="2" fill="url(#glass)" stroke="#9db7e0" strokeWidth="1.5" />
            <rect x="200" y="36" width="132" height="188" rx="1.5" fill="none" stroke="#b9c6d6" strokeWidth="3" />
            {/* casement opening indicator (hinge right) */}
            <line x1="332" y1="36" x2="200" y2="130" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="332" y1="224" x2="200" y2="130" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* glass sheen */}
            <line x1="214" y1="48" x2="300" y2="180" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="7" strokeLinecap="round" />
            {/* handle left */}
            <rect x="205" y="118" width="4" height="24" rx="2" fill="#4b5563" />

            {/* selected-section highlight on left */}
            <rect x="30" y="30" width="144" height="200" rx="3" fill="none" stroke="#2f6bff" strokeWidth="2.5" />

            {/* section badges */}
            <g>
              <circle cx="46" cy="46" r="11" fill="#ffffff" stroke="#16a34a" strokeWidth="1.5" />
              <text x="46" y="50" textAnchor="middle" fontSize="12" fontWeight="700" fill="#15803d">1</text>
              <circle cx="210" cy="46" r="11" fill="#ffffff" stroke="#16a34a" strokeWidth="1.5" />
              <text x="210" y="50" textAnchor="middle" fontSize="12" fontWeight="700" fill="#15803d">2</text>
            </g>

            {/* dimension line (width) */}
            <g stroke="#94a3b8" strokeWidth="1">
              <line x1="24" y1="250" x2="336" y2="250" />
              <line x1="24" y1="246" x2="24" y2="254" />
              <line x1="336" y1="246" x2="336" y2="254" />
            </g>
            <rect x="156" y="242" width="48" height="16" rx="3" fill="#ffffff" stroke="#e2e8f0" />
            <text x="180" y="253" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">1800</text>
          </svg>
        </div>

        {/* stats bar */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Area" value="24.75" unit="Sqft" />
          <Stat label="Sections" value="2" />
          <div className="rounded-lg bg-primary/10 px-3 py-2.5">
            <p className="text-[11px] text-primary/70">Total · incl. GST</p>
            <p className="text-sm font-bold text-primary">₹42,900</p>
          </div>
        </div>
      </div>

      {/* floating tool chip */}
      <div className="absolute -left-4 top-16 hidden rotate-[-4deg] items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-md)] sm:flex">
        <span className="flex h-7 w-9 items-center justify-center rounded bg-primary-soft text-[10px] font-bold text-primary">
          SL
        </span>
        <span className="text-xs font-medium text-heading">Sliding</span>
      </div>

      {/* floating PDF chip */}
      <div className="absolute -right-3 bottom-20 hidden rotate-[5deg] items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-md)] sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <FileText className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-medium text-heading">Proposal ready</span>
      </div>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-heading">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  )
}

const FEATURES = [
  {
    icon: PanelsTopLeft,
    title: 'Visual window designer',
    body: 'Compose frames section by section with couplers and mullions. 20+ window and door types with per-type options.',
  },
  {
    icon: Calculator,
    title: 'Automatic pricing',
    body: 'Area and amount calculated as you draw, with configurable per-type rates, GST and installation built in.',
  },
  {
    icon: FileText,
    title: 'Branded PDF proposals',
    body: 'Turn any quotation into a polished, client-ready proposal with every design drawn out — in one click.',
  },
  {
    icon: LayoutGrid,
    title: 'Reusable catalogue',
    body: 'Save designs and reuse them across quotations. Manage glass, colours and hardware from one place.',
  },
  {
    icon: Users,
    title: 'Client management',
    body: 'Keep clients, quotations and designs linked together so nothing slips through the cracks.',
  },
  {
    icon: Check,
    title: 'Quotations that add up',
    body: 'Each quotation aggregates its designs into totals you can trust, every time.',
  },
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
      {children}
    </span>
  )
}

function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border/60 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Features</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            Everything you need to quote faster
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            From the first sketch to the signed proposal, SoftWindow keeps your
            whole workflow in one tidy place.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-lg)]"
            >
              {/* top accent on hover */}
              <span className="absolute inset-x-0 top-0 h-0.5 scale-x-0 bg-gradient-to-r from-primary to-[#38bdf8] transition-transform duration-200 group-hover:scale-x-100" />
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#4f9bff] text-white shadow-[var(--shadow-primary)]">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-heading">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const STATS = [
  { value: '20+', label: 'Window & door types' },
  { value: '1-click', label: 'PDF proposals' },
  { value: 'Auto', label: 'Area & pricing' },
  { value: 'GST + install', label: 'Built into totals' },
]

function StatsStrip() {
  return (
    <section className="border-t border-border/60 bg-gradient-to-b from-primary-soft/40 to-transparent py-14">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const STEPS = [
  { n: '1', title: 'Draw the design', body: 'Drag window types into frame sections and set dimensions, glass and hardware.' },
  { n: '2', title: 'Build the quotation', body: 'Add one or more designs to a quotation; totals and area add up automatically.' },
  { n: '3', title: 'Send the proposal', body: 'Download a branded PDF or share it with your client in a click.' },
]

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-border/60 bg-muted/40 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            Three steps to a sent quotation
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            No training required — the flow mirrors how you already work.
          </p>
        </div>

        <div className="relative mt-14">
          {/* connector line across the three steps */}
          <div className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#4f9bff] text-base font-bold text-white shadow-[var(--shadow-primary)] ring-4 ring-background">
                  {s.n}
                </span>
                <div className="mt-5 w-full rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-md)]">
                  <h3 className="text-base font-semibold text-heading">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CallToAction() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2f6bff] to-[#38bdf8] px-8 py-14 text-center shadow-[var(--shadow-lg)]">
          <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-black/15 blur-3xl" />
          <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to quote your next job?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/80">
            Create your account and build your first quotation today.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs/getting-started">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Read the guide
              </Button>
            </Link>
          </div>
          <p className="relative mt-4 text-xs text-white/60">
            No credit card required · Set up in minutes
          </p>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          <span className="text-sm font-semibold text-heading">SoftWindow</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-foreground">Docs</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/login" className="hover:text-foreground">Log in</Link>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SoftWindow. Helpline: 879475061
        </p>
      </div>
    </footer>
  )
}
