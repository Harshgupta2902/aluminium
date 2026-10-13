/**
 * SoftWindow transactional email shell. Inline styles only, email-client safe.
 * Blue theme matching the app.
 */

export const EMAIL = {
  surface: '#f6f8fb',
  onSurface: '#1e293b',
  onSurfaceVariant: '#475569',
  outlineLight: '#e4eaf2',
  brand: '#2f6bff',
  brandBright: '#4f87ff',
  onBrand: '#ffffff',
  surfaceContainer: '#eaf1ff',
  card: '#ffffff',
  muted: '#7a8699',
  fontSans: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontHeading: "'Syne', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  radius: '16px',
  maxWidth: '600',
} as const

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function emailHead(): string {
  return `
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>SoftWindow</title>
  `
}

function emailHeader(appUrl: string): string {
  return `
  <tr>
    <td style="background:${EMAIL.brand};background:linear-gradient(135deg, ${EMAIL.brand} 0%, ${EMAIL.brandBright} 100%);padding:28px 32px;border-radius:${EMAIL.radius} ${EMAIL.radius} 0 0;">
      <a href="${appUrl}" style="text-decoration:none;display:inline-block;">
        <span style="font-family:${EMAIL.fontHeading};font-size:24px;font-weight:700;color:${EMAIL.onBrand};letter-spacing:-0.01em;">SoftWindow</span>
      </a>
      <p style="margin:8px 0 0;font-family:${EMAIL.fontSans};font-size:13px;color:rgba(255,255,255,0.88);line-height:1.4;">
        Design windows. Send quotations. Faster.
      </p>
    </td>
  </tr>`
}

type BuildEmailShellOptions = {
  appUrl: string
  bodyHtml: string
  footerHtml?: string
}

export function buildEmailShell({ appUrl, bodyHtml, footerHtml }: BuildEmailShellOptions): string {
  const footer =
    footerHtml ??
    `<p style="margin:0;font-family:${EMAIL.fontSans};font-size:12px;line-height:1.6;color:${EMAIL.muted};text-align:center;">
        <a href="${appUrl}" style="color:${EMAIL.brand};text-decoration:none;font-weight:600;">Visit SoftWindow</a>
      </p>`

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>${emailHead()}</head>
<body style="margin:0;padding:0;background-color:${EMAIL.surface};font-family:${EMAIL.fontSans};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="background-color:${EMAIL.surface};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="${EMAIL.maxWidth}" cellspacing="0" cellpadding="0" border="0" role="presentation"
          style="max-width:${EMAIL.maxWidth}px;width:100%;background-color:${EMAIL.card};border:1px solid ${EMAIL.outlineLight};border-radius:${EMAIL.radius};overflow:hidden;box-shadow:0 4px 24px rgba(47,107,255,0.08);">
          ${emailHeader(appUrl)}
          <tr>
            <td style="padding:32px 32px 28px;font-family:${EMAIL.fontSans};color:${EMAIL.onSurface};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background-color:${EMAIL.surfaceContainer};border-top:1px solid ${EMAIL.outlineLight};">
              ${footer}
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-family:${EMAIL.fontSans};font-size:11px;line-height:1.5;color:${EMAIL.muted};text-align:center;max-width:${EMAIL.maxWidth}px;">
          &copy; ${new Date().getFullYear()} SoftWindow. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${EMAIL.fontHeading};font-size:22px;font-weight:700;line-height:1.3;color:${EMAIL.onSurface};">${text}</h1>`
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${EMAIL.fontSans};font-size:16px;line-height:1.65;color:${EMAIL.onSurfaceVariant};">${html}</p>`
}

export function emailPrimaryButton(href: string, label: string): string {
  return `
  <table cellspacing="0" cellpadding="0" border="0" role="presentation" style="margin:8px 0 4px;">
    <tr>
      <td align="center" style="border-radius:12px;background:${EMAIL.brand};background:linear-gradient(135deg, ${EMAIL.brand} 0%, ${EMAIL.brandBright} 100%);">
        <a href="${href}" target="_blank"
          style="display:inline-block;padding:14px 32px;font-family:${EMAIL.fontSans};font-size:15px;font-weight:600;color:${EMAIL.onBrand};text-decoration:none;border-radius:12px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

export function emailInlineLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${EMAIL.brand};text-decoration:underline;font-weight:500;">${label}</a>`
}

export function emailDetailRow(label: string, value: string): string {
  return `<p style="margin:0 0 10px;font-family:${EMAIL.fontSans};font-size:16px;line-height:1.6;color:${EMAIL.onSurfaceVariant};">
    <strong style="color:${EMAIL.onSurface};">${label}</strong> ${escapeHtml(value)}
  </p>`
}
