'use client'

import { Undo2, Redo2, Trash2, Eraser, Maximize } from 'lucide-react'
import { useEditorStore } from '@/store/design-editor'
import { cn } from '@/lib/utils'

export function EditorToolbar() {
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)
  const clearAll = useEditorStore((s) => s.clearAll)
  const setZoom = useEditorStore((s) => s.setZoom)
  const zoom = useEditorStore((s) => s.zoom)
  const selectedId = useEditorStore((s) => s.selectedId)

  // Subscribe to the stacks so the buttons re-render on change.
  const canUndo = useEditorStore((s) => s.past.length > 0)
  const canRedo = useEditorStore((s) => s.future.length > 0)

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 text-sm">
      <div className="flex items-center gap-0.5 rounded-lg bg-gray-50 p-1">
        <ToolButton icon={Undo2} label="Undo" onClick={undo} disabled={!canUndo} />
        <ToolButton icon={Redo2} label="Redo" onClick={redo} disabled={!canRedo} />
      </div>

      <div className="flex items-center gap-0.5 rounded-lg bg-gray-50 p-1">
        <ToolButton
          icon={Trash2}
          label="Delete"
          onClick={deleteSelected}
          disabled={!selectedId}
        />
        <ToolButton
          icon={Eraser}
          label="Clear All"
          onClick={clearAll}
          variant="danger"
        />
      </div>

      <div className="ml-auto flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Zoom
        </span>
        <input
          type="range"
          min={25}
          max={300}
          step={5}
          value={Math.round(zoom * 100)}
          onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
          className="h-1.5 w-32 cursor-pointer accent-blue-600"
          aria-label="Zoom level"
        />
        <span className="w-11 text-right text-xs font-semibold text-blue-600">
          {Math.round(zoom * 100)}%
        </span>
        <div className="h-5 w-px bg-gray-200" />
        <ToolButton icon={Maximize} label="Fit" onClick={() => setZoom(1)} />
      </div>
    </div>
  )
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors',
        disabled
          ? 'cursor-not-allowed text-gray-300'
          : variant === 'danger'
            ? 'text-gray-700 hover:bg-red-50 hover:text-red-600'
            : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
