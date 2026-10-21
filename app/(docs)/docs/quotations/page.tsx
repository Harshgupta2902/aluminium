import type { Metadata } from 'next'
import {
  DocPage,
  DocH2,
  DocP,
  DocUL,
  DocSteps,
  DocCallout,
} from '@/components/docs/doc-content'

export const metadata: Metadata = {
  title: 'Building quotations · SoftWindow Docs',
  description:
    'Combine window designs into a quotation, apply GST, installation, labour and discounts, and track totals in real time.',
}

export default function QuotationsPage() {
  return (
    <DocPage
      title="Building quotations"
      lead="A quotation is a collection of designs for one client. Totals aggregate automatically from the designs."
      href="/docs/quotations"
    >
      <DocH2>Create a quotation</DocH2>
      <DocSteps
        steps={[
          {
            title: 'Open New Quotation',
            body: 'From Quotations, click New Quotation.',
          },
          {
            title: 'Choose a client',
            body: 'Pick an existing client or enter a new one — new clients are saved to your client list automatically.',
          },
          {
            title: 'Add designs',
            body: 'Use Add Design to draw a new one, or From Catalogue to clone a saved design onto this quotation.',
          },
        ]}
      />
      <DocCallout type="note">
        A draft is saved automatically as soon as the client name and phone are
        filled in, so your work is never lost.
      </DocCallout>

      <DocH2>Designs vs the catalogue</DocH2>
      <DocP>
        <strong>Add Design</strong> opens the editor for a brand-new design tied
        to this quotation. <strong>From Catalogue</strong> lets you reuse any
        previously saved design — it&apos;s copied onto the quotation so you can
        tweak it without affecting the original.
      </DocP>

      <DocH2>How totals work</DocH2>
      <DocP>Each design carries its own figures, and the quotation sums them:</DocP>
      <DocUL>
        <li><strong>Area</strong> — total square feet across the quotation&apos;s designs.</li>
        <li><strong>Amount</strong> — the sum of every design&apos;s price.</li>
      </DocUL>
      <DocP>
        These appear on the quotation listing (Area and Amount columns) and on
        the detail view, where every linked design is shown with its preview and
        totals.
      </DocP>

      <DocH2>Sending</DocH2>
      <DocP>
        Use <strong>Save &amp; Send</strong> to mark the quotation as sent, then
        download or share the PDF proposal. See{' '}
        <strong>PDF proposals</strong> for details.
      </DocP>
    </DocPage>
  )
}
