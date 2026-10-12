import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
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

  const stats = [
    { label: 'Total Clients', value: totalClients, className: 'text-heading' },
    { label: 'Active Clients', value: activeClients, className: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), className: 'text-primary' },
    { label: 'Avg Revenue', value: formatCurrency(activeClients > 0 ? totalRevenue / activeClients : 0), className: 'text-amber-600 dark:text-amber-400' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clients & CRM"
        description="Manage your clients and relationships"
      >
        <Button>
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.className}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>Client Database</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!clientsWithStats || clientsWithStats.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No clients yet</p>
              <Button>Add Your First Client</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5">Client</th>
                    <th className="px-4 py-2.5">Contact</th>
                    <th className="px-4 py-2.5">Added</th>
                    <th className="px-4 py-2.5 text-right">Quotations</th>
                    <th className="px-4 py-2.5 text-right">Revenue</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsWithStats.map((client) => (
                    <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-heading">{client.name}</div>
                            {client.company && (
                              <div className="text-xs text-muted-foreground">{client.company}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          {client.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatDate(client.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-heading">
                        {client.totalQuotations}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(client.totalRevenue)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm">Quote</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-2">
              {clientsWithStats
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5)
                .map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-heading">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.totalQuotations} quotations</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
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
