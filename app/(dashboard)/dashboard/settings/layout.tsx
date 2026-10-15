export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The settings sub-navigation now lives in the main sidebar (collapsible
  // "Settings" dropdown), so this layout just renders the active section.
  return <div className="space-y-5">{children}</div>
}
