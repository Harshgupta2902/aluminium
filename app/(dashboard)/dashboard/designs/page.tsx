import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { Plus } from 'lucide-react'
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
  // Live, request-time data: opt out of the static shell up front.
  await connection()

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
    <div className="space-y-4">
      <PageHeader
        title="Window Designs"
        description="Browse templates or create custom window designs"
      >
        <Link href="/design/new">
          <Button>
            <Plus className="h-4 w-4" />
            Open Design Editor
          </Button>
        </Link>
      </PageHeader>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Templates</p>
          <p className="mt-0.5 text-xl font-bold text-heading">{templates?.length || 0}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Categories</p>
          <p className="mt-0.5 text-xl font-bold text-heading">
            {Object.keys(templatesByCategory).length}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Custom Designs</p>
          <p className="mt-0.5 text-xl font-bold text-muted-foreground">Soon</p>
        </Card>
      </div>

      {/* Templates by Category */}
      {Object.keys(templatesByCategory).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No templates available yet</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
    </div>
  )
}
