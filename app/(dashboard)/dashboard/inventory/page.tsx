import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package, Wine, Wrench } from 'lucide-react'
import { connection } from 'next/server'

export default async function InventoryPage() {
  // Reads cookies (session) at request time; keep out of the static shell.
  await connection()

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">
          Manage profiles, glass, and accessories stock
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profiles</CardTitle>
            <Package className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{profilesCount || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Aluminium & UPVC profiles</p>
            <Button className="w-full mt-4" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Glass</CardTitle>
            <Wine className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{glassCount || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Glass types & thickness</p>
            <Button className="w-full mt-4" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Glass Type
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Accessories</CardTitle>
            <Wrench className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{accessoriesCount || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Hardware & accessories</p>
            <Button className="w-full mt-4" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Accessory
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Profiles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profiles Inventory</CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          {!profiles || profiles.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No profiles in inventory</p>
              <Button>Add Your First Profile</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-right py-3 px-4">Weight/Meter</th>
                    <th className="text-right py-3 px-4">Cost/Kg</th>
                    <th className="text-right py-3 px-4">Cost/Meter</th>
                    <th className="text-right py-3 px-4">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{profile.name}</td>
                      <td className="py-3 px-4 capitalize">{profile.type}</td>
                      <td className="py-3 px-4 text-right">{profile.weight_per_meter} kg</td>
                      <td className="py-3 px-4 text-right">₹{profile.cost_per_kg}</td>
                      <td className="py-3 px-4 text-right">₹{profile.cost_per_meter}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={profile.stock_quantity < 100 ? 'text-red-600 font-semibold' : ''}>
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
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          {!glass || glass.length === 0 ? (
            <div className="text-center py-12">
              <Wine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No glass in inventory</p>
              <Button>Add Your First Glass Type</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Thickness</th>
                    <th className="text-right py-3 px-4">Cost/Sqft</th>
                    <th className="text-right py-3 px-4">Stock (Sqft)</th>
                  </tr>
                </thead>
                <tbody>
                  {glass.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium capitalize">{item.type}</td>
                      <td className="py-3 px-4">{item.thickness}mm</td>
                      <td className="py-3 px-4 text-right">₹{item.cost_per_sqft}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={item.stock_quantity < 50 ? 'text-red-600 font-semibold' : ''}>
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
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          {!accessories || accessories.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No accessories in inventory</p>
              <Button>Add Your First Accessory</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-right py-3 px-4">Cost</th>
                    <th className="text-right py-3 px-4">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {accessories.map((accessory) => (
                    <tr key={accessory.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{accessory.name}</td>
                      <td className="py-3 px-4 capitalize">{accessory.category}</td>
                      <td className="py-3 px-4 text-right">₹{accessory.cost}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={accessory.stock_quantity < 10 ? 'text-red-600 font-semibold' : ''}>
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
