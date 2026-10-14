'use client'

import { useEffect, useRef, useState } from 'react'
import {
  WINDOW_CATEGORIES,
  type WindowTypeDef,
} from '@/lib/design-editor/frame-model'
import type { DragPayload } from './frame-canvas'
import {
  Columns,
  Rows,
  PanelLeft,
  DoorOpen,
  Wind,
  Sparkles,
  SquareStack,
  Grid2x2,
  SplitSquareHorizontal,
  type LucideIcon,
} from 'lucide-react'

/**
 * Slim, icon-only left rail (reference editor style). Each entry opens a
 * floating panel of draggable chips. "Dividers" is a built-in group; the
 * remaining groups come from the window-type categories.
 */

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Windows: PanelLeft,
  Doors: DoorOpen,
  Ventilation: Wind,
  Special: Sparkles,
  Screens: Grid2x2,
}

export function FrameToolRail() {
  const [open, setOpen] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Close the flyout on outside click / Escape.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(null)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  function setDrag(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.setData('application/x-wf', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const entries: { key: string; icon: LucideIcon }[] = [
    { key: 'Dividers', icon: SplitSquareHorizontal },
    ...WINDOW_CATEGORIES.map((c) => ({
      key: c.category,
      icon: CATEGORY_ICONS[c.category] ?? SquareStack,
    })),
  ]

  return (
    <div ref={rootRef} className="relative z-20 flex shrink-0">
      {/* Slim icon rail */}
      <div className="flex w-14 flex-col items-center gap-1 border-r border-gray-200 bg-white py-3">
        {entries.map(({ key, icon: Icon }) => {
          const active = open === key
          return (
            <button
              key={key}
              type="button"
              title={key}
              onClick={() => setOpen((o) => (o === key ? null : key))}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:bg-primary-soft/40 hover:text-primary'
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          )
        })}
      </div>

      {/* Flyout panel */}
      {open && (
        <div className="absolute left-14 top-2 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{open}</h3>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {open === 'Dividers' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <DividerChip
                  label="Coupler"
                  icon={<Columns className="h-4 w-4" />}
                  onDragStart={(e) => setDrag(e, { kind: 'coupler' })}
                />
                <DividerChip
                  label="Mullion"
                  icon={<Rows className="h-4 w-4" />}
                  onDragStart={(e) => setDrag(e, { kind: 'mullion' })}
                />
              </div>
              <p className="mt-2 text-[10px] leading-snug text-gray-400">
                Coupler splits a section. Mullion adds a lighter divider inside
                coupler sections.
              </p>
            </>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto">
              {WINDOW_CATEGORIES.find((c) => c.category === open)?.types.map(
                (def) => (
                  <WindowChip
                    key={def.id}
                    def={def}
                    onDragStart={(e) => setDrag(e, { kind: 'window', type: def.id })}
                  />
                )
              )}
            </div>
          )}

          <p className="mt-2 text-[10px] text-gray-400">Drag a chip onto a section.</p>
        </div>
      )}
    </div>
  )
}

function WindowChip({
  def,
  onDragStart,
}: {
  def: WindowTypeDef
  onDragStart: (e: React.DragEvent) => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab flex-col items-center gap-1 rounded-lg border border-gray-200 p-2 transition-colors hover:border-primary hover:bg-primary-soft/40 active:cursor-grabbing"
      title={def.label}
    >
      <span
        className="flex h-7 w-9 items-center justify-center rounded text-[10px] font-bold"
        style={{ background: def.fill, color: def.stroke, border: `1px solid ${def.stroke}33` }}
      >
        {def.icon}
      </span>
      <span className="line-clamp-2 text-center text-[10px] leading-tight text-gray-600">
        {def.label}
      </span>
    </div>
  )
}

function DividerChip({
  label,
  icon,
  onDragStart,
}: {
  label: string
  icon: React.ReactNode
  onDragStart: (e: React.DragEvent) => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-primary hover:bg-primary-soft/40 active:cursor-grabbing"
    >
      {icon}
      {label}
    </div>
  )
}
