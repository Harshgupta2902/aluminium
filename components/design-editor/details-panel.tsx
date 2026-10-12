'use client'

import { Minus, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  COLOUR_OPTIONS,
  GLASS_TYPE_OPTIONS,
} from '@/lib/design-editor/model'
import { useEditorStore } from '@/store/design-editor'

export function DetailsPanel({ onClose }: { onClose?: () => void }) {
  const details = useEditorStore((s) => s.details)
  const updateDetails = useEditorStore((s) => s.updateDetails)
  const shapes = useEditorStore((s) => s.shapes)
  const selectedId = useEditorStore((s) => s.selectedId)
  const updateShape = useEditorStore((s) => s.updateShape)

  const selected = shapes.find((s) => s.id === selectedId) ?? null

  return (
    <div className="flex h-full w-80 flex-col border-r bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold text-gray-900">Design Details</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Design Ref" required>
            <Input
              value={details.designRef}
              onChange={(e) => updateDetails({ designRef: e.target.value })}
            />
          </Field>
          <Field label="Design Name">
            <Input
              value={details.designName}
              placeholder="Search or type..."
              onChange={(e) => updateDetails({ designName: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price">
            <Input
              type="number"
              value={details.price ?? ''}
              onChange={(e) =>
                updateDetails({
                  price: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Quantity">
            <div className="flex items-center gap-1">
              <IconStep
                icon={Minus}
                onClick={() =>
                  updateDetails({
                    quantity: Math.max(1, details.quantity - 1),
                  })
                }
              />
              <Input
                type="number"
                min={1}
                value={details.quantity}
                onChange={(e) =>
                  updateDetails({ quantity: Math.max(1, Number(e.target.value) || 1) })
                }
                className="text-center"
              />
              <IconStep
                icon={Plus}
                onClick={() => updateDetails({ quantity: details.quantity + 1 })}
              />
            </div>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={details.unitPrice}
            onChange={(e) => updateDetails({ unitPrice: e.target.checked })}
            className="h-4 w-4 accent-blue-600"
          />
          Unit Price
        </label>

        <Field label="Colour">
          <Select
            value={details.colour}
            onChange={(e) => updateDetails({ colour: e.target.value })}
          >
            {COLOUR_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        {/* Dimensions of the selected window */}
        {selected && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Width (mm)">
              <Input
                type="number"
                value={selected.width}
                min={100}
                onChange={(e) =>
                  updateShape(selected.id, {
                    width: Math.max(100, Number(e.target.value) || 0),
                  })
                }
              />
            </Field>
            <Field label="Height (mm)">
              <Input
                type="number"
                value={selected.height}
                min={100}
                onChange={(e) =>
                  updateShape(selected.id, {
                    height: Math.max(100, Number(e.target.value) || 0),
                  })
                }
              />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Location">
            <Input
              value={details.location}
              onChange={(e) => updateDetails({ location: e.target.value })}
            />
          </Field>
          <Field label="Floor No">
            <Input
              value={details.floorNo}
              onChange={(e) => updateDetails({ floorNo: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Glass Type" required>
          <Select
            value={details.glassType}
            onChange={(e) => updateDetails({ glassType: e.target.value })}
          >
            <option value="">Select glass type...</option>
            {GLASS_TYPE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Message">
          <Textarea
            value={details.message}
            rows={3}
            onChange={(e) => updateDetails({ message: e.target.value })}
          />
        </Field>
      </div>

      <div className="border-t p-4">
        <Button className="w-full" onClick={onClose}>
          Apply
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

function IconStep({
  icon: Icon,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-input text-gray-600 hover:bg-gray-100"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
