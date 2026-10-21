import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Terms & Conditions · SoftWindow',
  description: 'The terms and conditions governing your use of the SoftWindow platform.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms &amp; Conditions" updated="October 2026">
      <p>
        These terms govern your use of SoftWindow (the &quot;Service&quot;). By
        creating an account or using the Service you agree to these terms. Please
        read them carefully.
      </p>

      <LegalSection title="1. Using the Service">
        <p>
          You may use the Service to design windows and doors, create quotations,
          and generate proposals for your business. You are responsible for the
          accuracy of the data you enter and for the quotations you send to your
          clients.
        </p>
      </LegalSection>

      <LegalSection title="2. Your account">
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activity under your account. Notify us promptly
          of any unauthorised use.
        </p>
      </LegalSection>

      <LegalSection title="3. Pricing &amp; estimates">
        <p>
          Pricing figures, areas and totals produced by the Service are estimates
          generated from the rates and settings you configure. You are
          responsible for verifying all figures before sharing them with clients.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>
          You agree not to misuse the Service, interfere with its operation, or
          attempt to access it in ways not permitted by these terms.
        </p>
      </LegalSection>

      <LegalSection title="5. Changes">
        <p>
          We may update these terms from time to time. Continued use of the
          Service after changes take effect constitutes acceptance of the revised
          terms.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact">
        <p>
          Questions about these terms? Reach us on our helpline: 879475061,
          8826619980.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
