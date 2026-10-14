'use client'

import { Undo2, Redo2, Trash2, Eraser, Maximize2 } from 'lucide-react'
import { useFrameStore, MIN_ZOOM, MAX_ZOOM } from '@/store/frame-editor'

/**
 * Top canvas toolbar, mirroring the reference editor:
 * Undo · Redo · Delete · Clear All · Zoom slider (%) · Fit.
 */
export function FrameToolbar() {
  const undo = useFrameStore((s) => s.undo)
  const redo = useFrameStore((s) => s.redo)
  const clearAll = useFrameStore((s) => s.clearAll)
  const clearSelectedWindow = useFrameStore((s) => s.clearSelectedWindow)
  const zoom = useFrameStore((s) => s.zoom)
  const setZoom = useFrameStore((s) => s.setZoom)
  const fitZoom = useFrameStore((s) => s.fitZoom)
  const past = useFrameStore((s) => s.past)
  const future = useFrameStore((s) => s.future)
  const selectedId = useFrameStore((s) => s.selectedSectionId)

  const canUndo = past.length > 0
  const canRedo = future.length > 0
  const pct = Math.round(zoom * 100)

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b border-gray-200 bg-white px-3">
      <ToolButton icon={Undo2} label="Undo" onClick={undo} disabled={!canUndo} />
      <ToolButton icon={Redo2} label="Redo" onClick={redo} disabled={!canRedo} />

      <Divider />

      <ToolButton
        icon={Trash2}
        label="Delete"
        onClick={clearSelectedWindow}
        disabled={selectedId == null}
      />
      <ToolButton icon={Eraser} label="Clear All" onClick={clearAll} />

      <Divider />

      {/* Zoom */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Zoom
        </span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1.5 w-28 cursor-pointer accent-primary"
          aria-label="Zoom"
        />
        <span className="w-10 text-xs font-semibold text-primary">{pct}%</span>
      </div>

      <ToolButton icon={Maximize2} label="Fit" onClick={fitZoom} />
    </div>
  )
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-gray-200" />
}
