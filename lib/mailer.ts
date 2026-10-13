import 'server-only'

import nodemailer, { type Transporter } from 'nodemailer'
import {
  buildEmailShell,
  emailDetailRow,
  emailHeading,
  emailInlineLink,
  emailParagraph,
  emailPrimaryButton,
  escapeHtml,
  EMAIL,
} from '@/lib/email/brand-template'
import { getSiteUrl } from '@/lib/site'

/**
 * Singleton SMTP transporter.
 *
 * Required env:
 *  - SMTP_USER       SMTP username / sending email address
 *  - SMTP_PASS       SMTP password (for Gmail, an app password)
 *
 * Optional env:
 *  - SMTP_SERVICE    nodemailer service preset (default: "gmail")
 *  - SMTP_HOST / SMTP_PORT  explicit host/port (used if SMTP_SERVICE unset)
 *  - SMTP_FROM_NAME  sender display name (default: "SoftWindow")
 *
 * Email links use the live request domain via getSiteUrl() — no env needed.
 */
let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) {
    throw new Error(
      'Missing SMTP credentials. Set SMTP_USER and SMTP_PASS in your environment.'
    )
  }

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user, pass },
    })
  } else {
    transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: { user, pass },
    })
  }
  return transporter
}

function getFromAddress(): string {
  const fromName = process.env.SMTP_FROM_NAME || 'SoftWindow'
  const user = process.env.SMTP_USER as string
  return `"${fromName}" <${user}>`
}

function credentialsTemplate(params: {
  appUrl: string
  recipientName: string
  loginEmail: string
  temporaryPassword: string
  loginUrl: string
  billingUrl: string
  docsUrl: string
}): string {
  const appUrl = params.appUrl
  const safeName = escapeHtml(params.recipientName)
  const safePassword = escapeHtml(params.temporaryPassword)

  const bodyHtml = `
    ${emailHeading('Your SoftWindow account is ready')}
    ${emailParagraph(`Hi ${safeName},`)}
    ${emailParagraph('An account has been created for you to design windows and build quotations. Use the credentials below to sign in:')}
    <table cellspacing="0" cellpadding="0" border="0" role="presentation" style="width:100%;margin:20px 0;border:1px solid ${EMAIL.outlineLight};border-radius:12px;background-color:${EMAIL.surfaceContainer};">
      <tr>
        <td style="padding:18px 20px;">
          ${emailDetailRow('Email:', params.loginEmail)}
          <p style="margin:0;font-family:${EMAIL.fontSans};font-size:16px;line-height:1.6;color:${EMAIL.onSurfaceVariant};">
            <strong style="color:${EMAIL.onSurface};">Temporary password:</strong>
            <span style="font-family:'Courier New',monospace;font-weight:700;letter-spacing:0.04em;color:${EMAIL.brand};">${safePassword}</span>
          </p>
        </td>
      </tr>
    </table>
    ${emailPrimaryButton(params.loginUrl, 'Log in to your account')}
    ${emailParagraph(`New here? ${emailInlineLink(params.docsUrl, 'Read the getting-started guide')} to send your first quotation. You can review your plan and billing anytime from ${emailInlineLink(params.billingUrl, 'the billing page')}.`)}
    ${emailParagraph('For your security, please change your password after your first login.')}
  `

  return buildEmailShell({
    appUrl,
    bodyHtml,
    footerHtml: `<p style="margin:0;font-family:${EMAIL.fontSans};font-size:12px;line-height:1.6;color:${EMAIL.muted};text-align:center;">
      Keep these credentials private and never share your password with anyone.
    </p>`,
  })
}

/**
 * Email login credentials to a user whose account was created by the superadmin.
 * Throws on configuration / send failure so the caller can decide what to do.
 */
export async function sendUserCredentialsEmail(params: {
  email: string
  recipientName: string
  temporaryPassword: string
}): Promise<void> {
  const t = getTransporter()
  const appUrl = await getSiteUrl()
  const safeName = params.recipientName.trim() || params.email.split('@')[0] || 'there'

  const info = await t.sendMail({
    from: getFromAddress(),
    to: params.email,
    subject: 'Your SoftWindow account has been created',
    html: credentialsTemplate({
      appUrl,
      recipientName: safeName,
      loginEmail: params.email,
      temporaryPassword: params.temporaryPassword,
      loginUrl: `${appUrl}/login`,
      billingUrl: `${appUrl}/dashboard/billing`,
      docsUrl: `${appUrl}/docs/getting-started`,
    }),
  })

  console.log('[mailer] Credentials email sent:', info.messageId, '→', params.email)
}
