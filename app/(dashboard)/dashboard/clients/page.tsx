import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Phone, Mail } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function ClientsPage() {
  const supabase = await createClient()

  // Fetch clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  // For each client, get quotation stats
  const clientsWithStats = await Promise.all(
    (clients || []).map(async (client) => {
      const { data: quotations } = await supabase
        .from('quotations')
        .select('total_amount, status')
        .eq('client_id', client.id)

      const totalQuotations = quotations?.length || 0
      const totalRevenue = quotations
        ?.filter(q => q.status === 'approved')
        .reduce((sum, q) => sum + q.total_amount, 0) || 0

      return {
        ...client,
        totalQuotations,
        totalRevenue,
      }
    })
  )

  const totalClients = clients?.length || 0
  const activeClients = clientsWithStats.filter(c => c.totalQuotations > 0).length
  const totalRevenue = clientsWithStats.reduce((sum, c) => sum + c.totalRevenue, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients & CRM</h1>
          <p className="text-gray-600 mt-1">
            Manage your clients and relationships
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{totalClients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{activeClients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Avg Revenue</CardTitle>
            <Users className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(activeClients > 0 ? totalRevenue / activeClients : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>Client Database</CardTitle>
        </CardHeader>
        <CardContent>
          {!clientsWithStats || clientsWithStats.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No clients yet</p>
              <Button>Add Your First Client</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {clientsWithStats.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-600">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{client.name}</h3>
                      {client.company && (
                        <p className="text-sm text-gray-600">{client.company}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{client.email}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Added: {formatDate(client.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Quotations</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {client.totalQuotations}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(client.totalRevenue)}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm">
                        New Quotation
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clients by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {clientsWithStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {clientsWithStats
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5)
                .map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.totalQuotations} quotations</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(client.totalRevenue)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
