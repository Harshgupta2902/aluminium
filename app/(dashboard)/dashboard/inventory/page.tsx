import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { Plus, Package, Wine, Wrench } from 'lucide-react'

export default async function InventoryPage() {
  const supabase = await createClient()

  // Fetch inventory counts
  const { count: profilesCount } = await supabase
    .from('profiles_inventory')
    .select('*', { count: 'exact', head: true })

  const { count: glassCount } = await supabase
    .from('glass_inventory')
    .select('*', { count: 'exact', head: true })

  const { count: accessoriesCount } = await supabase
    .from('accessories')
    .select('*', { count: 'exact', head: true })

  // Fetch sample data
  const { data: profiles } = await supabase
    .from('profiles_inventory')
    .select('*')
    .limit(5)

  const { data: glass } = await supabase
    .from('glass_inventory')
    .select('*')
    .limit(5)

  const { data: accessories } = await supabase
    .from('accessories')
    .select('*')
    .limit(5)

  const summary = [
    { title: 'Profiles', count: profilesCount || 0, hint: 'Aluminium & UPVC profiles', icon: Package, action: 'Add Profile' },
    { title: 'Glass', count: glassCount || 0, hint: 'Glass types & thickness', icon: Wine, action: 'Add Glass Type' },
    { title: 'Accessories', count: accessoriesCount || 0, hint: 'Hardware & accessories', icon: Wrench, action: 'Add Accessory' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventory Management"
        description="Manage profiles, glass, and accessories stock"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.title} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
                <p className="mt-1 text-2xl font-bold text-heading">{item.count}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
              </div>
              <div className="rounded-lg bg-primary-soft p-2.5">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-3" size="sm">
              <Plus className="h-4 w-4" />
              {item.action}
            </Button>
          </Card>
        ))}
      </div>

      {/* Profiles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profiles Inventory</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!profiles || profiles.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No profiles in inventory</p>
              <Button>Add Your First Profile</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5 text-right">Weight/Meter</th>
                    <th className="px-4 py-2.5 text-right">Cost/Kg</th>
                    <th className="px-4 py-2.5 text-right">Cost/Meter</th>
                    <th className="px-4 py-2.5 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium text-heading">{profile.name}</td>
                      <td className="px-4 py-2.5 capitalize text-muted-foreground">{profile.type}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{profile.weight_per_meter} kg</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">₹{profile.cost_per_kg}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">₹{profile.cost_per_meter}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={profile.stock_quantity < 100 ? 'font-semibold text-destructive' : 'text-foreground'}>
                          {profile.stock_quantity} {profile.unit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Glass */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Glass Inventory</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!glass || glass.length === 0 ? (
            <div className="text-center py-10">
              <Wine className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No glass in inventory</p>
              <Button>Add Your First Glass Type</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Thickness</th>
                    <th className="px-4 py-2.5 text-right">Cost/Sqft</th>
                    <th className="px-4 py-2.5 text-right">Stock (Sqft)</th>
                  </tr>
                </thead>
                <tbody>
                  {glass.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium capitalize text-heading">{item.type}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{item.thickness}mm</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">₹{item.cost_per_sqft}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={item.stock_quantity < 50 ? 'font-semibold text-destructive' : 'text-foreground'}>
                          {item.stock_quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accessories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Accessories Inventory</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!accessories || accessories.length === 0 ? (
            <div className="text-center py-10">
              <Wrench className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No accessories in inventory</p>
              <Button>Add Your First Accessory</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">Cost</th>
                    <th className="px-4 py-2.5 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {accessories.map((accessory) => (
                    <tr key={accessory.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium text-heading">{accessory.name}</td>
                      <td className="px-4 py-2.5 capitalize text-muted-foreground">{accessory.category}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">₹{accessory.cost}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={accessory.stock_quantity < 10 ? 'font-semibold text-destructive' : 'text-foreground'}>
                          {accessory.stock_quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
