'use client'

import { useEffect, useRef, useState } from 'react'
import {
  WINDOW_PRESET_GROUPS,
  WINDOW_TYPE_MAP,
  type WindowPreset,
} from '@/lib/design-editor/frame-model'
import { renderWindow } from './window-renderers'
import type { DragPayload } from './frame-canvas'
import {
  Columns,
  Rows,
  PanelLeft,
  DoorOpen,
  Wind,
  Sparkles,
  Grid2x2,
  SquareStack,
  Blinds,
  SplitSquareHorizontal,
  type LucideIcon,
} from 'lucide-react'

/**
 * Slim, icon-only left rail (reference parity). Each entry opens a floating
 * panel of draggable preset chips with a real mini SVG preview. "Dividers" is
 * a built-in group; the rest come from WINDOW_PRESET_GROUPS.
 */

const GROUP_ICONS: Record<string, LucideIcon> = {
  Windows: PanelLeft,
  'Casement Windows': SquareStack,
  'Sliding Windows': Columns,
  'Slim Windows': Rows,
  Doors: DoorOpen,
  Ventilation: Wind,
  'Special Elements': Sparkles,
  Screens: Blinds,
}

export function FrameToolRail() {
  const [open, setOpen] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null)
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
    ...WINDOW_PRESET_GROUPS.map((g) => ({
      key: g.group,
      icon: GROUP_ICONS[g.group] ?? Grid2x2,
    })),
  ]

  const activeGroup = WINDOW_PRESET_GROUPS.find((g) => g.group === open)

  return (
    <div ref={rootRef} className="relative z-20 flex shrink-0">
      {/* Slim icon rail */}
      <div className="flex w-14 flex-col items-center gap-1 overflow-y-auto border-r border-gray-200 bg-white py-3">
        {entries.map(({ key, icon: Icon }) => {
          const active = open === key
          return (
            <button
              key={key}
              type="button"
              title={key}
              onClick={() => setOpen((o) => (o === key ? null : key))}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
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
        <div className="absolute left-14 top-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
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
                <DividerChip label="Coupler" icon={<Columns className="h-4 w-4" />} onDragStart={(e) => setDrag(e, { kind: 'coupler' })} />
                <DividerChip label="Mullion" icon={<Rows className="h-4 w-4" />} onDragStart={(e) => setDrag(e, { kind: 'mullion' })} />
              </div>
              <p className="mt-2 text-[10px] leading-snug text-gray-400">
                Coupler splits a section. Mullion adds a lighter divider inside
                coupler sections.
              </p>
            </>
          ) : (
            <div className="grid max-h-[64vh] grid-cols-2 gap-2 overflow-y-auto">
              {activeGroup?.presets.map((p) => (
                <PresetChip
                  key={p.id}
                  preset={p}
                  onDragStart={(e) => setDrag(e, { kind: 'window', presetId: p.id, type: p.type })}
                />
              ))}
            </div>
          )}

          <p className="mt-2 text-[10px] text-gray-400">Drag a chip onto a section.</p>
        </div>
      )}
    </div>
  )
}

function PresetChip({
  preset,
  onDragStart,
}: {
  preset: WindowPreset
  onDragStart: (e: React.DragEvent) => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab flex-col items-center gap-1.5 rounded-lg border border-gray-200 p-2 transition-colors hover:border-primary hover:bg-primary-soft/40 active:cursor-grabbing"
      title={preset.label}
    >
      <div className="relative">
        <PresetPreview preset={preset} />
        <span className="absolute right-0.5 top-0.5 rounded bg-white/80 px-1 text-[8px] font-bold text-gray-500">
          {preset.badge}
        </span>
      </div>
      <span className="line-clamp-2 text-center text-[10px] leading-tight text-gray-600">
        {preset.label}
      </span>
    </div>
  )
}

/** A tiny real SVG preview of a preset, using the canvas renderer. */
function PresetPreview({ preset }: { preset: WindowPreset }) {
  const W = 76
  const H = 52
  const pad = 4
  const props = { ...(WINDOW_TYPE_MAP[preset.type]?.defaults() ?? {}), ...(preset.props ?? {}) }
  const win = { type: preset.type, props } as Parameters<typeof renderWindow>[0]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="rounded bg-white">
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={2} fill="#f8fafc" stroke="#e2e8f0" />
      {renderWindow(win, { x: pad, y: pad, w: W - pad * 2, h: H - pad * 2, glass: '#dbeafe' })}
    </svg>
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
