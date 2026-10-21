import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy · SoftWindow',
  description: 'How SoftWindow collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>
        This policy explains what information SoftWindow (the &quot;Service&quot;)
        collects, how it is used, and the choices you have.
      </p>

      <LegalSection title="1. Information we collect">
        <p>
          We collect the account details you provide (such as your name, company
          and email) and the business data you create in the Service — clients,
          window designs and quotations.
        </p>
      </LegalSection>

      <LegalSection title="2. How we use information">
        <p>
          We use your information to operate the Service: to authenticate you,
          store your designs and quotations, and generate proposals. We do not
          sell your personal information.
        </p>
      </LegalSection>

      <LegalSection title="3. Data storage">
        <p>
          Your data is stored securely with our hosting and database providers.
          Access is restricted to your account through authentication and
          row-level security.
        </p>
      </LegalSection>

      <LegalSection title="4. Client data">
        <p>
          Client details you enter are used solely to produce your quotations and
          proposals. You are responsible for having the right to store and use
          that information.
        </p>
      </LegalSection>

      <LegalSection title="5. Your choices">
        <p>
          You can update or delete the data in your account at any time. To close
          your account or request deletion of your data, contact us.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact">
        <p>
          Questions about privacy? Reach us on our helpline: 879475061,
          8826619980.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
