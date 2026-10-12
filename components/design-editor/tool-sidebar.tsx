'use client'

import { useState } from 'react'
import {
  PanelsTopLeft,
  SlidersHorizontal,
  Square,
  DoorOpen,
  GalleryHorizontal,
  X,
} from 'lucide-react'
import {
  TEMPLATE_CATEGORIES,
  type WindowTemplate,
} from '@/lib/design-editor/model'
import { useEditorStore } from '@/store/design-editor'
import { cn } from '@/lib/utils'
import { MiniTemplatePreview } from './mini-template-preview'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Sliding Windows': GalleryHorizontal,
  'Casement Windows': SlidersHorizontal,
  'Fixed Windows': Square,
  Doors: DoorOpen,
}

export function ToolSidebar({
  onOpenDetails,
}: {
  onOpenDetails: () => void
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const addTemplate = useEditorStore((s) => s.addTemplate)

  const flyout = TEMPLATE_CATEGORIES.find((c) => c.category === openCategory)

  const handleAdd = (template: WindowTemplate) => {
    addTemplate(template)
    setOpenCategory(null)
  }

  return (
    <div className="relative flex">
      {/* Icon rail */}
      <div className="flex w-14 flex-col items-center gap-1 border-r bg-white py-3">
        <RailButton
          icon={PanelsTopLeft}
          label="Details"
          active={false}
          onClick={() => {
            setOpenCategory(null)
            onOpenDetails()
          }}
        />
        <div className="my-1 h-px w-8 bg-gray-200" />
        {TEMPLATE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.category] ?? Square
          return (
            <RailButton
              key={cat.category}
              icon={Icon}
              label={cat.category}
              active={openCategory === cat.category}
              onClick={() =>
                setOpenCategory((cur) =>
                  cur === cat.category ? null : cat.category
                )
              }
            />
          )
        })}
      </div>

      {/* Flyout template picker */}
      {flyout && (
        <div className="absolute left-14 top-2 z-20 w-72 rounded-lg border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <h3 className="text-sm font-semibold text-gray-900">
              {flyout.category}
            </h3>
            <button
              type="button"
              onClick={() => setOpenCategory(null)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            {flyout.templates.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => handleAdd(template)}
                className="group flex flex-col items-center gap-1 rounded-md border border-transparent p-2 hover:border-blue-300 hover:bg-blue-50"
              >
                <MiniTemplatePreview template={template} />
                <span className="text-[11px] font-medium text-gray-600 group-hover:text-blue-700">
                  {template.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RailButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
