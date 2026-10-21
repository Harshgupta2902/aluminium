import type { Metadata } from 'next'
import {
  DocPage,
  DocH2,
  DocP,
  DocUL,
  DocCallout,
} from '@/components/docs/doc-content'

export const metadata: Metadata = {
  title: 'PDF proposals · SoftWindow Docs',
  description:
    'Generate branded, professional PDF proposals from your quotations and share them with clients in one click.',
}

export default function PdfProposalsPage() {
  return (
    <DocPage
      title="PDF proposals"
      lead="Turn any quotation into a branded, client-ready PDF with every design drawn out."
      href="/docs/pdf-proposals"
    >
      <DocH2>Generating a proposal</DocH2>
      <DocP>
        Click <strong>Download PDF</strong> from either the quotations list or a
        quotation&apos;s detail page. The proposal is generated in your browser
        and downloaded instantly.
      </DocP>

      <DocH2>What&apos;s included</DocH2>
      <DocUL>
        <li>A branded header with your company details.</li>
        <li>The client&apos;s information and the quotation number.</li>
        <li>
          One block per design, with the window drawn out plus its area, rate,
          glass and colour.
        </li>
        <li>Aggregated totals, including area and the grand total.</li>
      </DocUL>

      <DocCallout type="tip">
        The drawing in the PDF is generated from the same design you see in the
        editor, so what you draw is what your client receives.
      </DocCallout>

      <DocH2>Sharing on WhatsApp</DocH2>
      <DocP>
        The <strong>Send via WhatsApp</strong> button opens a prefilled message
        for the client. Configure a WhatsApp Business API in your environment to
        attach the PDF directly; otherwise it opens WhatsApp with a summary
        message you can send manually.
      </DocP>
    </DocPage>
  )
}
