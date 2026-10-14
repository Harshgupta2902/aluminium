import { redirect } from 'next/navigation'

export default function SettingsPage() {
  // Settings is a nested-nav section; land on the first panel.
  redirect('/dashboard/settings/aluminium')
}
