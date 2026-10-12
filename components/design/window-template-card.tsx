'use client'

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
  onSelect?: (template: WindowTemplateCardProps['template']) => void
}

export function WindowTemplateCard({ template, onSelect }: WindowTemplateCardProps) {
  return (
    <Card
      className="hover:shadow-md hover:border-border-strong transition-all cursor-pointer"
      onClick={onSelect ? () => onSelect(template) : undefined}
    >
      <CardContent className="p-3">
        <div className="aspect-[4/3] bg-muted rounded-lg mb-2.5 flex items-center justify-center overflow-hidden">
          {template.image_url ? (
            <Image
              src={template.image_url}
              alt={template.name}
              width={200}
              height={200}
              className="object-contain"
            />
          ) : (
            <div className="text-center">
              <Palette className="w-8 h-8 mx-auto text-muted-foreground/50 mb-1" />
              <p className="text-xs text-muted-foreground capitalize">{template.window_type}</p>
            </div>
          )}
        </div>
        <h3 className="font-semibold text-sm text-heading truncate">{template.name}</h3>
        {template.description && (
          <p className="text-xs text-muted-foreground truncate mb-1.5">{template.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="capitalize">{template.category}</span>
          <span>{template.default_width} × {template.default_height}mm</span>
        </div>
        <Button className="w-full mt-2.5" size="sm">
          Use Template
        </Button>
      </CardContent>
    </Card>
  )
}
