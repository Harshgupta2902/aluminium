import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { WindowTemplateCard } from '@/components/design/window-template-card'

interface TemplateRow {
  id: string
  name: string
  category: string
  window_type: string
  default_width: number
  default_height: number
  image_url?: string
  description?: string
}

export default async function DesignsPage() {
  const supabase = await createClient()

  // Fetch window templates
  const { data: templates } = await supabase
    .from('window_templates')
    .select('*')
    .order('category')

  const templateList = (templates ?? []) as TemplateRow[]

  // Group templates by category
  const templatesByCategory = templateList.reduce<Record<string, TemplateRow[]>>(
    (acc, template) => {
      const category = template.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(template)
      return acc
    },
    {}
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Window Designs</h1>
          <p className="text-gray-600 mt-1">
            Browse templates or create custom window designs
          </p>
        </div>
        <Link href="/design/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Open Design Editor
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search window templates..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates by Category */}
      {Object.keys(templatesByCategory).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No templates available yet</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
          <div key={category}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categoryTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/design/new?windowType=${encodeURIComponent(
                    template.window_type
                  )}&width=${template.default_width}&height=${template.default_height}`}
                >
                  <WindowTemplateCard template={template} />
                </Link>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{templates?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">
              {Object.keys(templatesByCategory).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Custom Designs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">Coming Soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
