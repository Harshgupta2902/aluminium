'use client'

import { useState } from 'react'
import { WINDOW_CATEGORIES, type WindowTypeDef } from '@/lib/design-editor/frame-model'
import type { DragPayload } from './frame-canvas'
import { Rows, Columns } from 'lucide-react'

/**
 * Left tool rail: draggable window-type chips grouped by category, plus
 * coupler / mullion divider tools. Drag a chip onto a section in the canvas.
 */
export function FrameToolRail() {
  const [open, setOpen] = useState<string | null>('Windows')

  function setDrag(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.setData('application/x-wf', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Add elements</h2>
        <p className="mt-0.5 text-xs text-gray-400">Drag onto a section</p>
      </div>

      {/* Dividers */}
      <div className="border-b border-gray-100 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Dividers
        </p>
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
      </div>

      {/* Window types by category */}
      {WINDOW_CATEGORIES.map(({ category, types }) => (
        <div key={category} className="border-b border-gray-100">
          <button
            type="button"
            onClick={() => setOpen((o) => (o === category ? null : category))}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50"
          >
            {category}
            <span className="text-gray-300">{open === category ? '−' : '+'}</span>
          </button>
          {open === category && (
            <div className="grid grid-cols-2 gap-2 px-3 pb-3">
              {types.map((def) => (
                <WindowChip
                  key={def.id}
                  def={def}
                  onDragStart={(e) => setDrag(e, { kind: 'window', type: def.id })}
                />
              ))}
            </div>
          )}
        </div>
      ))}
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
      className="flex cursor-grab flex-col items-center gap-1 rounded-lg border border-gray-200 p-2 transition-colors hover:border-blue-400 hover:bg-blue-50/40 active:cursor-grabbing"
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
      className="flex cursor-grab items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50/40 active:cursor-grabbing"
    >
      {icon}
      {label}
    </div>
  )
}
