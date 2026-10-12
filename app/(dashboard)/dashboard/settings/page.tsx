import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure your application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Company details and branding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calculation Formulas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Cost calculation settings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Manage users and roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">WhatsApp and other integrations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
