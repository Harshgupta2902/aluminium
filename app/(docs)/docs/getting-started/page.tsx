import type { Metadata } from 'next'
import Link from 'next/link'
import {
  DocPage,
  DocH2,
  DocP,
  DocSteps,
  DocCallout,
} from '@/components/docs/doc-content'

export const metadata: Metadata = {
  title: 'Quick start · SoftWindow Docs',
}

export default function GettingStartedPage() {
  return (
    <DocPage
      title="Quick start"
      lead="Go from sign-up to your first sent quotation in a few minutes."
      href="/docs/getting-started"
    >
      <DocH2>1. Create your account</DocH2>
      <DocP>
        Head to the sign-up page and enter your name, company and email. Your
        workspace is ready immediately — no setup required.
      </DocP>
      <DocCallout type="note">
        Already have an account?{' '}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>{' '}
        instead.
      </DocCallout>

      <DocH2>2. The core flow</DocH2>
      <DocP>
        Everything in SoftWindow revolves around three building blocks: a{' '}
        <strong>design</strong> (a window or combination you draw), a{' '}
        <strong>quotation</strong> (a collection of designs for a client), and a{' '}
        <strong>proposal</strong> (the PDF you send). The usual path is:
      </DocP>
      <DocSteps
        steps={[
          {
            title: 'Start a quotation',
            body: (
              <>
                From the dashboard, open <strong>Quotations → New Quotation</strong>{' '}
                and pick or add a client.
              </>
            ),
          },
          {
            title: 'Add a design',
            body: (
              <>
                Click <strong>Add Design</strong> to open the editor, or{' '}
                <strong>From Catalogue</strong> to reuse a saved one.
              </>
            ),
          },
          {
            title: 'Draw and price it',
            body: 'Drag window types into the frame; area and amount are calculated as you go.',
          },
          {
            title: 'Send the proposal',
            body: 'Back on the quotation, download the branded PDF or share it with your client.',
          },
        ]}
      />

      <DocH2>3. Next steps</DocH2>
      <DocP>
        Learn each part in depth: <Link href="/docs/designing-windows" className="font-medium text-primary underline">Designing windows</Link>,{' '}
        <Link href="/docs/quotations" className="font-medium text-primary underline">Building quotations</Link>,{' '}
        <Link href="/docs/pdf-proposals" className="font-medium text-primary underline">PDF proposals</Link>, and{' '}
        <Link href="/docs/settings" className="font-medium text-primary underline">Settings &amp; catalog</Link>.
      </DocP>
    </DocPage>
  )
}
