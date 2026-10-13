import type { Metadata } from 'next'
import {
  DocPage,
  DocH2,
  DocP,
  DocUL,
  DocCallout,
} from '@/components/docs/doc-content'

export const metadata: Metadata = {
  title: 'Settings & catalog · SoftWindow Docs',
}

export default function SettingsDocsPage() {
  return (
    <DocPage
      title="Settings & catalog"
      lead="Manage the lists and pricing the design editor uses, all from one place."
      href="/docs/settings"
    >
      <DocP>
        Open <strong>Settings → Design Catalog &amp; Pricing</strong> to manage
        everything the editor offers when drawing a design.
      </DocP>

      <DocH2>Configurable lists</DocH2>
      <DocP>
        Each list supports adding, renaming, reordering, marking a default,
        hiding an entry, and deleting:
      </DocP>
      <DocUL>
        <li><strong>Glass types</strong> — with an optional rate per sqft.</li>
        <li><strong>Colours</strong> — with an optional hex for the swatch.</li>
        <li><strong>GI hardware</strong> — tracks, sashes, interlocks and locks, each with a profile code.</li>
      </DocUL>
      <DocCallout type="note">
        New entries appear in the editor immediately. If the lists are empty,
        the editor falls back to a sensible built-in set.
      </DocCallout>

      <DocH2>Pricing</DocH2>
      <DocP>
        Pricing is driven by three things you control:
      </DocP>
      <DocUL>
        <li>
          <strong>Base rate per window type</strong> — the starting ₹/sqft for
          each type, scaled by a size curve as windows get larger.
        </li>
        <li><strong>GST %</strong> — added to the subtotal.</li>
        <li><strong>Installation %</strong> — added to the subtotal.</li>
      </DocUL>
      <DocP>
        A design&apos;s amount is its area × rate, plus GST and installation. If
        you set a manual <strong>Rate / Sqft</strong> on a design, that value is
        used instead of the computed base rate.
      </DocP>
    </DocPage>
  )
}
