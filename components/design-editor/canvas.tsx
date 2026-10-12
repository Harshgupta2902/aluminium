'use client'

import { useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/design-editor'
import {
  computeShapeGeometry,
  type WindowShape,
  type PanelGeometry,
} from '@/lib/design-editor/model'

/**
 * Pixels per mm at 100% zoom. Window of 1000mm => 200px, which fits the
 * canvas comfortably while leaving room for dimension lines.
 */
const PX_PER_MM = 0.2

/** Padding (px) around the content inside the SVG viewport. */
const PADDING = 120

export function DesignCanvas() {
  const shapes = useEditorStore((s) => s.shapes)
  const selectedId = useEditorStore((s) => s.selectedId)
  const zoom = useEditorStore((s) => s.zoom)
  const selectShape = useEditorStore((s) => s.selectShape)
  const updateShape = useEditorStore((s) => s.updateShape)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const scale = PX_PER_MM * zoom

  // Drag state kept in a ref so we commit a single history entry on drop.
  const drag = useRef<{
    id: string
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
    liveX: number
    liveY: number
  } | null>(null)

  // Live positions during a drag (so we don't spam the history store).
  const [livePos, setLivePos] = useState<Record<string, { x: number; y: number }>>(
    {}
  )

  const onPointerDownShape = useCallback(
    (e: React.PointerEvent, shape: WindowShape) => {
      e.stopPropagation()
      selectShape(shape.id)
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      drag.current = {
        id: shape.id,
        startX: e.clientX,
        startY: e.clientY,
        originX: shape.x,
        originY: shape.y,
        moved: false,
        liveX: shape.x,
        liveY: shape.y,
      }
    },
    [selectShape]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dxPx = e.clientX - d.startX
      const dyPx = e.clientY - d.startY
      if (Math.abs(dxPx) > 2 || Math.abs(dyPx) > 2) d.moved = true
      const nx = Math.round(d.originX + dxPx / scale)
      const ny = Math.round(d.originY + dyPx / scale)
      d.liveX = nx
      d.liveY = ny
      setLivePos((p) => ({ ...p, [d.id]: { x: nx, y: ny } }))
    },
    [scale]
  )

  const endDrag = useCallback(() => {
    const d = drag.current
    if (!d) return
    if (d.moved) {
      updateShape(d.id, { x: d.liveX, y: d.liveY })
    }
    setLivePos((p) => {
      const next = { ...p }
      delete next[d.id]
      return next
    })
    drag.current = null
  }, [updateShape])

  // Compute content bounds so we can center and size the SVG viewBox.
  const positioned = shapes.map((s) => {
    const live = livePos[s.id]
    return live ? { ...s, x: live.x, y: live.y } : s
  })

  const bounds = computeBounds(positioned)
  const contentW = (bounds.maxX - bounds.minX) * scale
  const contentH = (bounds.maxY - bounds.minY) * scale
  const viewW = Math.max(contentW + PADDING * 2, 400)
  const viewH = Math.max(contentH + PADDING * 2, 400)

  // mm -> px transform helpers, mapping bounds.min to PADDING.
  const toPx = (mm: number, axis: 'x' | 'y') =>
    PADDING + (mm - (axis === 'x' ? bounds.minX : bounds.minY)) * scale

  return (
    <div className="relative h-full w-full overflow-auto bg-[#f3f4f6]">
      <svg
        ref={svgRef}
        width={viewW}
        height={viewH}
        className="mx-auto my-auto block select-none"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerDown={() => selectShape(null)}
      >
        <GridPattern />
        <rect width={viewW} height={viewH} fill="url(#editor-grid)" />

        {positioned.length === 0 && (
          <text
            x={viewW / 2}
            y={viewH / 2}
            textAnchor="middle"
            className="fill-gray-400 text-sm"
          >
            Pick a window from the left to start designing
          </text>
        )}

        {positioned.map((shape) => (
          <ShapeView
            key={shape.id}
            shape={shape}
            scale={scale}
            toPx={toPx}
            selected={shape.id === selectedId}
            onPointerDown={(e) => onPointerDownShape(e, shape)}
          />
        ))}
      </svg>
    </div>
  )
}

function GridPattern() {
  return (
    <defs>
      <pattern
        id="editor-grid"
        width={20}
        height={20}
        patternUnits="userSpaceOnUse"
      >
        <circle cx={1} cy={1} r={1} className="fill-gray-300" />
      </pattern>
    </defs>
  )
}

interface ShapeViewProps {
  shape: WindowShape
  scale: number
  toPx: (mm: number, axis: 'x' | 'y') => number
  selected: boolean
  onPointerDown: (e: React.PointerEvent) => void
}

function ShapeView({ shape, scale, toPx, selected, onPointerDown }: ShapeViewProps) {
  const geo = computeShapeGeometry(shape)

  const px = (mm: number, axis: 'x' | 'y') => toPx(mm, axis)
  const len = (mm: number) => mm * scale

  const ox = px(geo.outer.x, 'x')
  const oy = px(geo.outer.y, 'y')
  const ow = len(geo.outer.width)
  const oh = len(geo.outer.height)

  return (
    <g onPointerDown={onPointerDown} className="cursor-move">
      {/* Outer frame */}
      <rect
        x={ox}
        y={oy}
        width={ow}
        height={oh}
        rx={2}
        className={
          selected
            ? 'fill-white stroke-blue-500'
            : 'fill-white stroke-gray-700'
        }
        strokeWidth={selected ? 3 : 2}
      />

      {/* Glass panels */}
      {geo.panels.map((panel) => (
        <PanelView key={panel.index} panel={panel} px={px} len={len} />
      ))}

      {/* Center index badge */}
      <g>
        <circle
          cx={ox + ow / 2}
          cy={oy + oh / 2}
          r={16}
          className="fill-white stroke-green-600"
          strokeWidth={2}
        />
        <text
          x={ox + ow / 2}
          y={oy + oh / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-green-700 text-sm font-semibold"
        >
          {shape.index}
        </text>
      </g>

      {/* Dimension lines */}
      <WidthDimension
        x1={ox}
        x2={ox + ow}
        y={oy + oh + 28}
        label={`${shape.width}`}
      />
      <HeightDimension
        y1={oy}
        y2={oy + oh}
        x={ox - 28}
        label={`${shape.height}`}
      />
    </g>
  )
}

function PanelView({
  panel,
  px,
  len,
}: {
  panel: PanelGeometry
  px: (mm: number, axis: 'x' | 'y') => number
  len: (mm: number) => number
}) {
  const x = px(panel.rect.x, 'x')
  const y = px(panel.rect.y, 'y')
  const w = len(panel.rect.width)
  const h = len(panel.rect.height)

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        className="fill-emerald-100/70 stroke-gray-500"
        strokeWidth={1.5}
      />
      {/* Opening indicator for casement/door panels */}
      {panel.hinge && (
        <OpeningIndicator x={x} y={y} w={w} h={h} hinge={panel.hinge} />
      )}
    </g>
  )
}

function OpeningIndicator({
  x,
  y,
  w,
  h,
  hinge,
}: {
  x: number
  y: number
  w: number
  h: number
  hinge: 'left' | 'right'
}) {
  // Draw an "X-less" triangle: two lines meeting at the hinge side mid-height.
  const midY = y + h / 2
  const hingeX = hinge === 'left' ? x : x + w
  const tipX = hinge === 'left' ? x + w : x
  return (
    <g className="stroke-gray-400" strokeWidth={1} fill="none">
      <line x1={hingeX} y1={y} x2={tipX} y2={midY} />
      <line x1={hingeX} y1={y + h} x2={tipX} y2={midY} />
    </g>
  )
}

function WidthDimension({
  x1,
  x2,
  y,
  label,
}: {
  x1: number
  x2: number
  y: number
  label: string
}) {
  return (
    <g className="stroke-gray-500" strokeWidth={1}>
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <rect
        x={(x1 + x2) / 2 - 24}
        y={y - 11}
        width={48}
        height={22}
        rx={3}
        className="fill-white stroke-gray-300"
      />
      <text
        x={(x1 + x2) / 2}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-gray-800 text-xs font-semibold"
        stroke="none"
      >
        {label}
      </text>
    </g>
  )
}

function HeightDimension({
  y1,
  y2,
  x,
  label,
}: {
  y1: number
  y2: number
  x: number
  label: string
}) {
  return (
    <g className="stroke-gray-500" strokeWidth={1}>
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
      <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
      <g transform={`rotate(-90 ${x} ${(y1 + y2) / 2})`}>
        <rect
          x={x - 24}
          y={(y1 + y2) / 2 - 11}
          width={48}
          height={22}
          rx={3}
          className="fill-white stroke-gray-300"
        />
        <text
          x={x}
          y={(y1 + y2) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-800 text-xs font-semibold"
          stroke="none"
        >
          {label}
        </text>
      </g>
    </g>
  )
}

function computeBounds(shapes: WindowShape[]) {
  if (shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of shapes) {
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + s.width)
    maxY = Math.max(maxY, s.y + s.height)
  }
  return { minX, minY, maxX, maxY }
}
