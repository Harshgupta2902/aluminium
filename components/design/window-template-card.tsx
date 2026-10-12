import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Palette } from 'lucide-react'
import Image from 'next/image'

interface WindowTemplateCardProps {
  template: {
    id: string
    name: string
    category: string
    window_type: string
    default_width: number
    default_height: number
    image_url?: string
    description?: string
  }
  onSelect: (template: any) => void
}

export function WindowTemplateCard({ template, onSelect }: WindowTemplateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(template)}>
      <CardContent className="p-4">
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
          {template.image_url ? (
            <Image
              src={template.image_url}
              alt={template.name}
              width={200}
              height={200}
              className="object-contain"
            />
          ) : (
            <div className="text-center p-4">
              <Palette className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 capitalize">{template.window_type}</p>
            </div>
          )}
        </div>
        <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="capitalize">{template.category}</span>
          <span>{template.default_width} × {template.default_height}mm</span>
        </div>
        <Button className="w-full mt-3" size="sm">
          Use Template
        </Button>
      </CardContent>
    </Card>
  )
}
