'use client'

import { useRef, useState } from 'react'
import { useFrameStore } from '@/store/frame-editor'
import { renderWindow } from './window-renderers'
import { FRAME_MM, type WindowTypeId } from '@/lib/design-editor/frame-model'

const PX_PER_MM = 0.3
const PAD = 90

export interface DragPayload {
  kind: 'window' | 'coupler' | 'mullion'
  type?: WindowTypeId
}

/** Normalise panel fractions to a panel count (sum = 1). */
function fractionsOf(props: Record<string, unknown>, panels: number): number[] {
  const raw = Array.isArray(props.panelFractions) ? (props.panelFractions as number[]) : []
  if (raw.length === panels && raw.every((f) => Number.isFinite(f) && f > 0)) {
    const total = raw.reduce((a, b) => a + b, 0)
    return raw.map((f) => f / total)
  }
  return Array(panels).fill(1 / panels)
}

export function FrameCanvas() {
  const doc = useFrameStore((s) => s.doc)
  const zoom = useFrameStore((s) => s.zoom)
  const selectedId = useFrameStore((s) => s.selectedSectionId)
  const selectedPanelIdx = useFrameStore((s) => s.selectedPanelIdx)
  const selectSection = useFrameStore((s) => s.selectSection)
  const selectPanel = useFrameStore((s) => s.selectPanel)
  const dropWindow = useFrameStore((s) => s.dropWindow)
  const dropDivider = useFrameStore((s) => s.dropDivider)
  const setFrameSize = useFrameStore((s) => s.setFrameSize)
  const setPanelWidth = useFrameStore((s) => s.setPanelWidth)
  const moveDividerTo = useFrameStore((s) => s.moveDividerTo)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const scale = PX_PER_MM * zoom

  const frameW = doc.width * scale
  const frameH = doc.height * scale
  const viewW = frameW + PAD * 2
  const viewH = frameH + PAD * 2

  // mm -> px inside the frame (frame origin at PAD,PAD).
  const px = (mm: number) => PAD + mm * scale

  // Drag state for moving a divider.
  const dragRef = useRef<{ id: number; orient: 'v' | 'h' } | null>(null)

  function clientToMm(clientX: number, clientY: number): { x: number; y: number } | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const sx = (clientX - rect.left) * (viewW / rect.width)
    const sy = (clientY - rect.top) * (viewH / rect.height)
    return { x: (sx - PAD) / scale, y: (sy - PAD) / scale }
  }

  function pointerToMm(e: React.DragEvent): { x: number; y: number } | null {
    return clientToMm(e.clientX, e.clientY)
  }

  function readPayload(e: React.DragEvent): DragPayload | null {
    const raw = e.dataTransfer.getData('application/x-wf')
    if (!raw) return null
    try {
      return JSON.parse(raw) as DragPayload
    } catch {
      return null
    }
  }

  const onDropCanvas = (e: React.DragEvent) => {
    e.preventDefault()
    const payload = readPayload(e)
    const at = pointerToMm(e)
    if (!payload || !at) return

    if (payload.kind === 'coupler' || payload.kind === 'mullion') {
      const sec = doc.sections.find(
        (s) => at.x > s.sx && at.x < s.sx + s.sw && at.y > s.sy && at.y < s.sy + s.sh
      )
      if (!sec) return
      const relX = (at.x - sec.sx) / sec.sw
      const relY = (at.y - sec.sy) / sec.sh
      const orient: 'v' | 'h' =
        Math.abs(relX - 0.5) <= Math.abs(relY - 0.5) ? 'v' : 'h'
      dropDivider(orient, at.x, at.y, payload.kind)
    } else if (payload.kind === 'window' && payload.type) {
      const sec = doc.sections.find(
        (s) => at.x > s.sx && at.x < s.sx + s.sw && at.y > s.sy && at.y < s.sy + s.sh
      )
      if (sec) dropWindow(sec.id, payload.type)
    }
  }

  // ---- divider dragging ----
  const onDividerDown = (e: React.PointerEvent, id: number, orient: 'v' | 'h') => {
    e.stopPropagation()
    dragRef.current = { id, orient }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const at = clientToMm(e.clientX, e.clientY)
    if (!at) return
    moveDividerTo(drag.id, drag.orient === 'v' ? at.x : at.y)
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  // ---- editable-dimension prompt helper ----
  const promptMm = (current: number, label: string): number | null => {
    const raw = window.prompt(`${label} (mm)`, String(Math.round(current)))
    if (raw == null) return null
    const n = Math.round(Number(raw))
    if (!Number.isFinite(n) || n <= 0) return null
    return n
  }

  return (
    <div className="relative h-full w-full overflow-auto bg-[#eef1f4]" data-frame-canvas>
      <svg
        ref={svgRef}
        width={viewW}
        height={viewH}
        className="mx-auto my-auto block select-none"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropCanvas}
        onPointerDown={() => selectSection(null)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <defs>
          <pattern id="wf-grid" width={24} height={24} patternUnits="userSpaceOnUse">
            <circle cx={1} cy={1} r={1} className="fill-gray-300" />
          </pattern>
        </defs>
        <rect width={viewW} height={viewH} fill="url(#wf-grid)" />

        {/* Outer frame band */}
        <rect
          x={px(0) - FRAME_MM * scale}
          y={px(0) - FRAME_MM * scale}
          width={frameW + FRAME_MM * scale * 2}
          height={frameH + FRAME_MM * scale * 2}
          fill="#cbd5e1"
          stroke="#64748b"
          strokeWidth={2}
          rx={3}
        />
        <rect x={px(0)} y={px(0)} width={frameW} height={frameH} fill="#ffffff" />

        {/* Sections */}
        {doc.sections.map((sec) => {
          const sx = px(sec.sx)
          const sy = px(sec.sy)
          const sw = sec.sw * scale
          const sh = sec.sh * scale
          const selected = sec.id === selectedId
          const isSliding = sec.window?.type === 'sliding'
          const panelCount = isSliding
            ? Math.max(1, Number(sec.window!.props.panels) || 2)
            : 0
          const fracs = isSliding ? fractionsOf(sec.window!.props, panelCount) : []
          // Pixel left-offsets per panel.
          const offs: number[] = []
          let acc = 0
          for (const f of fracs) {
            offs.push(acc)
            acc += f * sw
          }
          return (
            <g
              key={sec.id}
              onPointerDown={(e) => {
                e.stopPropagation()
                selectSection(sec.id)
              }}
              className="cursor-pointer"
            >
              {sec.window ? (
                renderWindow(sec.window, { x: sx, y: sy, w: sw, h: sh, glass: '#dbeafe' })
              ) : (
                <rect x={sx} y={sy} width={sw} height={sh} fill="#f8fafc" stroke="#cbd5e1" strokeDasharray="4 3" strokeWidth={1} />
              )}

              {/* Per-panel interactive overlay (sliding only) */}
              {isSliding &&
                fracs.map((f, i) => {
                  const pxl = sx + offs[i]
                  const pw = f * sw
                  const panelSelected = selected && selectedPanelIdx === i
                  const panelWidthMm = Math.round(sec.sw * f)
                  return (
                    <g
                      key={`p${i}`}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        selectSection(sec.id)
                        selectPanel(i)
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x={pxl}
                        y={sy}
                        width={pw}
                        height={sh}
                        fill={panelSelected ? '#2563eb' : 'transparent'}
                        fillOpacity={panelSelected ? 0.08 : 0}
                        stroke={panelSelected ? '#2563eb' : 'transparent'}
                        strokeWidth={panelSelected ? 2 : 0}
                      />
                      {/* Panel badge S<sec>.<panel> */}
                      <g pointerEvents="none">
                        <circle cx={pxl + pw / 2} cy={sy + 20} r={11} fill="#ffffff" stroke={panelSelected ? '#2563eb' : '#16a34a'} strokeWidth={1.25} />
                        <text x={pxl + pw / 2} y={sy + 20} textAnchor="middle" dominantBaseline="central" className={`text-[9px] font-bold ${panelSelected ? 'fill-blue-600' : 'fill-green-700'}`}>
                          {sec.idx}.{i + 1}
                        </text>
                      </g>
                      {/* Editable per-panel width pill at the bottom */}
                      {panelCount > 1 && (
                        <DimPill
                          cx={pxl + pw / 2}
                          cy={sy + sh - 16}
                          label={`${panelWidthMm}`}
                          onEdit={() => {
                            const v = promptMm(panelWidthMm, `Panel ${sec.idx}.${i + 1} width`)
                            if (v != null) setPanelWidth(sec.id, i, v)
                          }}
                        />
                      )}
                    </g>
                  )
                })}

              {/* Section selection outline (hidden when a panel is highlighted) */}
              <rect
                x={sx}
                y={sy}
                width={sw}
                height={sh}
                fill="transparent"
                stroke={selected && selectedPanelIdx == null ? '#2563eb' : 'transparent'}
                strokeWidth={selected && selectedPanelIdx == null ? 2.5 : 0}
                pointerEvents="none"
              />
              {/* Section index badge (non-sliding) */}
              {!isSliding && (
                <g pointerEvents="none">
                  <circle cx={sx + 13} cy={sy + 13} r={9} fill="#ffffff" stroke="#16a34a" strokeWidth={1.25} />
                  <text x={sx + 13} y={sy + 13} textAnchor="middle" dominantBaseline="central" className="fill-green-700 text-[10px] font-bold">
                    {sec.idx}
                  </text>
                </g>
              )}
              {!sec.window && (
                <text x={sx + sw / 2} y={sy + sh / 2} textAnchor="middle" dominantBaseline="central" className="fill-gray-400 text-[11px]" pointerEvents="none">
                  Drop a window
                </text>
              )}
            </g>
          )
        })}

        {/* Dividers (couplers + mullions) — draggable */}
        {doc.dividers.map((d) => {
          const dw = d.cw * scale
          const dh = d.ch * scale
          const dx = px(d.cx)
          const dy = px(d.cy)
          // Widen the hit area for easier grabbing.
          const hit = 8
          return (
            <g key={d.id}>
              <rect
                x={dx}
                y={dy}
                width={dw}
                height={dh}
                fill={d.kind === 'coupler' ? '#64748b' : '#94a3b8'}
                stroke="#475569"
                strokeWidth={0.5}
              />
              <rect
                x={d.orient === 'v' ? dx - hit : dx}
                y={d.orient === 'h' ? dy - hit : dy}
                width={d.orient === 'v' ? dw + hit * 2 : dw}
                height={d.orient === 'h' ? dh + hit * 2 : dh}
                fill="transparent"
                className={d.orient === 'v' ? 'cursor-ew-resize' : 'cursor-ns-resize'}
                onPointerDown={(e) => onDividerDown(e, d.id, d.orient)}
              />
            </g>
          )
        })}

        {/* Frame dimension labels (editable) */}
        <WidthDim
          x1={px(0)}
          x2={px(doc.width)}
          y={px(doc.height) + 34}
          label={`${doc.width}`}
          onEdit={() => {
            const v = promptMm(doc.width, 'Frame width')
            if (v != null) setFrameSize(v, doc.height)
          }}
        />
        <HeightDim
          y1={px(0)}
          y2={px(doc.height)}
          x={px(0) - FRAME_MM * scale - 34}
          label={`${doc.height}`}
          onEdit={() => {
            const v = promptMm(doc.height, 'Frame height')
            if (v != null) setFrameSize(doc.width, v)
          }}
        />
      </svg>
    </div>
  )
}

/** Small editable dimension chip. Click to edit via prompt. */
function DimPill({
  cx,
  cy,
  label,
  onEdit,
}: {
  cx: number
  cy: number
  label: string
  onEdit: () => void
}) {
  const [hover, setHover] = useState(false)
  const w = 46
  return (
    <g
      className="cursor-pointer"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onEdit()
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <rect
        x={cx - w / 2}
        y={cy - 10}
        width={w}
        height={20}
        rx={3}
        className={hover ? 'fill-blue-50 stroke-blue-400' : 'fill-white stroke-gray-300'}
      />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="fill-gray-800 text-[11px] font-semibold" stroke="none">
        {label}
      </text>
    </g>
  )
}

function WidthDim({
  x1,
  x2,
  y,
  label,
  onEdit,
}: {
  x1: number
  x2: number
  y: number
  label: string
  onEdit: () => void
}) {
  return (
    <g>
      <g className="stroke-gray-500" strokeWidth={1}>
        <line x1={x1} y1={y} x2={x2} y2={y} />
        <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
        <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      </g>
      <DimPill cx={(x1 + x2) / 2} cy={y} label={label} onEdit={onEdit} />
    </g>
  )
}

function HeightDim({
  y1,
  y2,
  x,
  label,
  onEdit,
}: {
  y1: number
  y2: number
  x: number
  label: string
  onEdit: () => void
}) {
  return (
    <g>
      <g className="stroke-gray-500" strokeWidth={1}>
        <line x1={x} y1={y1} x2={x} y2={y2} />
        <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
        <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
      </g>
      <g transform={`rotate(-90 ${x} ${(y1 + y2) / 2})`}>
        <DimPill cx={x} cy={(y1 + y2) / 2} label={label} onEdit={onEdit} />
      </g>
    </g>
  )
}
