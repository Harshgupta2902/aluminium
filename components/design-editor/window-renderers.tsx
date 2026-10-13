'use client'

import type { ReactNode } from 'react'
import type { SectionWindow, WindowTypeId } from '@/lib/design-editor/frame-model'

/**
 * SVG renderers for every window type. Each renderer draws into a section
 * rectangle (x, y, w, h in px, already scaled). Pure SVG so the same code can
 * drive the live canvas and the read-only preview.
 */

export interface DrawCtx {
  x: number
  y: number
  w: number
  h: number
  glass: string // glass fill
}

const GLASS = '#dbeafe'
const GLASS_EDGE = '#93c5fd'
const FRAME = '#4b5563'
const SASH = '#6b7280'
const META = '#9ca3af'

export function renderWindow(win: SectionWindow, ctx: DrawCtx): ReactNode {
  const fn = RENDERERS[win.type]
  return fn ? fn(win, ctx) : renderGeneric(win, ctx)
}

type Renderer = (win: SectionWindow, c: DrawCtx) => ReactNode

/* ---------- shared primitives ---------- */

function glassRect(x: number, y: number, w: number, h: number, fill = GLASS) {
  return (
    <rect x={x} y={y} width={w} height={h} fill={fill} stroke={GLASS_EDGE} strokeWidth={1} />
  )
}

function sashBorder(x: number, y: number, w: number, h: number, inset = 4) {
  return (
    <rect
      x={x + inset}
      y={y + inset}
      width={Math.max(0, w - inset * 2)}
      height={Math.max(0, h - inset * 2)}
      fill="none"
      stroke={SASH}
      strokeWidth={1.5}
    />
  )
}

/** Casement opening "V" indicator (hinge side vertical, tip to opposite mid). */
function openingV(
  x: number,
  y: number,
  w: number,
  h: number,
  hinge: 'left' | 'right',
  dashed = false
) {
  const midY = y + h / 2
  const hx = hinge === 'left' ? x : x + w
  const tx = hinge === 'left' ? x + w : x
  return (
    <g stroke={META} strokeWidth={1} fill="none" strokeDasharray={dashed ? '3 2' : undefined}>
      <line x1={hx} y1={y} x2={tx} y2={midY} />
      <line x1={hx} y1={y + h} x2={tx} y2={midY} />
    </g>
  )
}

/** Top/bottom-hung opening indicator (apex at top or bottom edge). */
function openingH(
  x: number,
  y: number,
  w: number,
  h: number,
  edge: 'top' | 'bottom'
) {
  const midX = x + w / 2
  const ay = edge === 'top' ? y : y + h
  const by = edge === 'top' ? y + h : y
  return (
    <g stroke={META} strokeWidth={1} fill="none">
      <line x1={x} y1={ay} x2={midX} y2={by} />
      <line x1={x + w} y1={ay} x2={midX} y2={by} />
    </g>
  )
}

function handle(cx: number, cy: number) {
  return <rect x={cx - 1.5} y={cy - 7} width={3} height={14} rx={1.5} fill="#374151" />
}

/* ---------- per-type renderers ---------- */

const renderFixed: Renderer = (win, { x, y, w, h }) => {
  const grids = (win.props.grids as string) ?? 'none'
  const gx = Number(win.props.gridDivX) || 2
  const gy = Number(win.props.gridDivY) || 2
  return (
    <g>
      {glassRect(x, y, w, h)}
      {grids !== 'none' && (
        <g stroke={SASH} strokeWidth={1}>
          {Array.from({ length: gx - 1 }, (_, i) => (
            <line key={`v${i}`} x1={x + (w / gx) * (i + 1)} y1={y} x2={x + (w / gx) * (i + 1)} y2={y + h} />
          ))}
          {Array.from({ length: gy - 1 }, (_, i) => (
            <line key={`h${i}`} x1={x} y1={y + (h / gy) * (i + 1)} x2={x + w} y2={y + (h / gy) * (i + 1)} />
          ))}
        </g>
      )}
    </g>
  )
}

const renderSliding: Renderer = (win, { x, y, w, h }) => {
  const panels = Number(win.props.panels) || 2
  const dirs = (win.props.panelDirs as string[]) ?? []
  const pw = w / panels
  return (
    <g>
      {Array.from({ length: panels }, (_, i) => {
        const px = x + pw * i
        const dir = dirs[i]
        return (
          <g key={i}>
            {glassRect(px, y, pw, h)}
            {sashBorder(px, y, pw, h)}
            {/* slide arrow */}
            {dir && (
              <g stroke={META} strokeWidth={1.2} fill="none">
                <line x1={px + pw * 0.3} y1={y + h / 2} x2={px + pw * 0.7} y2={y + h / 2} />
                <polyline
                  points={
                    dir === 'right'
                      ? `${px + pw * 0.6},${y + h / 2 - 4} ${px + pw * 0.7},${y + h / 2} ${px + pw * 0.6},${y + h / 2 + 4}`
                      : `${px + pw * 0.4},${y + h / 2 - 4} ${px + pw * 0.3},${y + h / 2} ${px + pw * 0.4},${y + h / 2 + 4}`
                  }
                />
              </g>
            )}
            {handle(dir === 'right' ? px + 7 : px + pw - 7, y + h / 2)}
          </g>
        )
      })}
      {win.props.mesh ? <MeshOverlay x={x} y={y} w={pw} h={h} /> : null}
    </g>
  )
}

const renderCasement: Renderer = (win, { x, y, w, h }) => {
  const hinge = ((win.props.hingeSide as string) || 'left') as 'left' | 'right'
  return (
    <g>
      {glassRect(x, y, w, h)}
      {sashBorder(x, y, w, h)}
      {openingV(x, y, w, h, hinge, (win.props.openDir as string) === 'inward')}
      {handle(hinge === 'left' ? x + w - 7 : x + 7, y + h / 2)}
    </g>
  )
}

const renderDoubleCasement: Renderer = (win, { x, y, w, h }) => {
  const hw = w / 2
  return (
    <g>
      {glassRect(x, y, hw, h)}
      {sashBorder(x, y, hw, h)}
      {openingV(x, y, hw, h, 'left', (win.props.openDir as string) === 'inward')}
      {glassRect(x + hw, y, hw, h)}
      {sashBorder(x + hw, y, hw, h)}
      {openingV(x + hw, y, hw, h, 'right', (win.props.openDir as string) === 'inward')}
      {handle(x + hw - 5, y + h / 2)}
      {handle(x + hw + 5, y + h / 2)}
    </g>
  )
}

const renderFixedCasement: Renderer = (win, { x, y, w, h }) => {
  // Left fixed, right casement.
  const hw = w / 2
  return (
    <g>
      {glassRect(x, y, hw, h)}
      {glassRect(x + hw, y, hw, h)}
      {sashBorder(x + hw, y, hw, h)}
      {openingV(x + hw, y, hw, h, 'right')}
      {handle(x + hw + 7, y + h / 2)}
    </g>
  )
}

const renderTopHung: Renderer = (win, { x, y, w, h }) => (
  <g>
    {glassRect(x, y, w, h)}
    {sashBorder(x, y, w, h)}
    {openingH(x, y, w, h, (win.props.openDir as string) === 'inward' ? 'bottom' : 'top')}
  </g>
)

const renderAwning: Renderer = (_win, { x, y, w, h }) => (
  <g>
    {glassRect(x, y, w, h)}
    {sashBorder(x, y, w, h)}
    {openingH(x, y, w, h, 'top')}
  </g>
)

const renderLouvered: Renderer = (win, { x, y, w, h }) => {
  const blades = Number(win.props.blades) || 6
  const bh = h / blades
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#eef2f7" stroke={GLASS_EDGE} strokeWidth={1} />
      {Array.from({ length: blades }, (_, i) => (
        <rect
          key={i}
          x={x + 2}
          y={y + bh * i + 1}
          width={w - 4}
          height={bh - 2}
          rx={1}
          fill="#e2e8f0"
          stroke={SASH}
          strokeWidth={0.75}
        />
      ))}
    </g>
  )
}

const renderDoorSingle: Renderer = (win, { x, y, w, h }) => {
  const hinge = ((win.props.hingeSide as string) || 'left') as 'left' | 'right'
  const style = (win.props.panelStyle as string) || 'panel'
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#f3f4f6" stroke={FRAME} strokeWidth={1.5} />
      {style === 'glass' ? (
        glassRect(x + 6, y + 6, w - 12, h - 12)
      ) : (
        <g fill="none" stroke={SASH} strokeWidth={1}>
          <rect x={x + 8} y={y + 8} width={w - 16} height={h * 0.45} />
          <rect x={x + 8} y={y + h * 0.52} width={w - 16} height={h * 0.4} />
        </g>
      )}
      {openingV(x, y, w, h, hinge, (win.props.openDir as string) === 'inward')}
      {handle(hinge === 'left' ? x + w - 9 : x + 9, y + h / 2)}
    </g>
  )
}

const renderDoorDouble: Renderer = (win, { x, y, w, h }) => {
  const hw = w / 2
  const style = (win.props.panelStyle as string) || 'panel'
  const leaf = (lx: number, hinge: 'left' | 'right') => (
    <g>
      <rect x={lx} y={y} width={hw} height={h} fill="#f3f4f6" stroke={FRAME} strokeWidth={1.5} />
      {style === 'glass'
        ? glassRect(lx + 5, y + 5, hw - 10, h - 10)
        : (
          <g fill="none" stroke={SASH} strokeWidth={1}>
            <rect x={lx + 6} y={y + 6} width={hw - 12} height={h * 0.45} />
            <rect x={lx + 6} y={y + h * 0.52} width={hw - 12} height={h * 0.4} />
          </g>
        )}
      {openingV(lx, y, hw, h, hinge, (win.props.openDir as string) === 'inward')}
    </g>
  )
  return (
    <g>
      {leaf(x, 'left')}
      {leaf(x + hw, 'right')}
      {handle(x + hw - 5, y + h / 2)}
      {handle(x + hw + 5, y + h / 2)}
    </g>
  )
}

const renderVentilator: Renderer = (win, { x, y, w, h }) => {
  const rows = Number(win.props.rows) || 3
  const cols = Number(win.props.cols) || 5
  const cw = w / cols
  const ch = h / rows
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#efebe9" stroke="#8d6e63" strokeWidth={1.5} />
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <rect
            key={`${r}-${c}`}
            x={x + cw * c + 2}
            y={y + ch * r + 2}
            width={cw - 4}
            height={ch - 4}
            fill="#d7ccc8"
            stroke="#a1887f"
            strokeWidth={0.5}
          />
        ))
      )}
    </g>
  )
}

const renderExhaustFan: Renderer = (win, { x, y, w, h }) => {
  const blades = Number(win.props.blades) || 4
  const cx = x + w / 2
  const cy = y + h / 2
  const r = Math.min(w, h) / 2 - 4
  return (
    <g>
      {glassRect(x, y, w, h, '#eceff1')}
      <circle cx={cx} cy={cy} r={r} fill="#cfd8dc" stroke="#607d8b" strokeWidth={1.5} />
      {Array.from({ length: blades }, (_, i) => {
        const a = (i / blades) * Math.PI * 2
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * r * 0.85}
            y2={cy + Math.sin(a) * r * 0.85}
            stroke="#78909c"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )
      })}
      <circle cx={cx} cy={cy} r={r * 0.18} fill="#455a64" />
    </g>
  )
}

const renderExhaustRect: Renderer = (win, { x, y, w, h }) => (
  <g>
    {glassRect(x, y, w, h, '#eceff1')}
    <rect x={x + w * 0.15} y={y + h * 0.15} width={w * 0.7} height={h * 0.7} fill="#cfd8dc" stroke="#607d8b" strokeWidth={1.5} />
    {renderExhaustFan(win, { x: x + w * 0.15, y: y + h * 0.15, w: w * 0.7, h: h * 0.7, glass: '#eceff1' })}
  </g>
)

const renderAcSleeve: Renderer = (win, { x, y, w, h }) => {
  const n = Number(win.props.louverCount) || 5
  const bh = (h - 8) / n
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#e3f2fd" stroke="#1a3a5c" strokeWidth={1.5} />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + 4} y={y + 4 + bh * i} width={w - 8} height={bh - 2} fill="#bbdefb" stroke="#64b5f6" strokeWidth={0.5} />
      ))}
    </g>
  )
}

const renderGlassBlock: Renderer = (win, { x, y, w, h }) => {
  const rows = Number(win.props.rows) || 2
  const cols = Number(win.props.cols) || 4
  const cw = w / cols
  const ch = h / rows
  return (
    <g>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <rect
            key={`${r}-${c}`}
            x={x + cw * c + 1}
            y={y + ch * r + 1}
            width={cw - 2}
            height={ch - 2}
            rx={2}
            fill="#e1f5fe"
            stroke="#4fc3f7"
            strokeWidth={1}
          />
        ))
      )}
    </g>
  )
}

const renderGeorgian: Renderer = (win, { x, y, w, h }) => {
  const gx = Number(win.props.gridDivX) || 3
  const gy = Number(win.props.gridDivY) || 2
  return (
    <g>
      {glassRect(x, y, w, h)}
      <g stroke={SASH} strokeWidth={1.5}>
        {Array.from({ length: gx - 1 }, (_, i) => (
          <line key={`v${i}`} x1={x + (w / gx) * (i + 1)} y1={y} x2={x + (w / gx) * (i + 1)} y2={y + h} />
        ))}
        {Array.from({ length: gy - 1 }, (_, i) => (
          <line key={`h${i}`} x1={x} y1={y + (h / gy) * (i + 1)} x2={x + w} y2={y + (h / gy) * (i + 1)} />
        ))}
      </g>
    </g>
  )
}

const renderRollerShutter: Renderer = (win, { x, y, w, h }) => {
  const n = Number(win.props.slatCount) || 12
  const sh = h / n
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#eceff1" stroke={FRAME} strokeWidth={1.5} />
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={x} y1={y + sh * (i + 1)} x2={x + w} y2={y + sh * (i + 1)} stroke="#90a4ae" strokeWidth={1} />
      ))}
    </g>
  )
}

const renderSkylight: Renderer = (_win, { x, y, w, h }) => (
  <g>
    {glassRect(x, y, w, h, '#e0f7fa')}
    <line x1={x} y1={y} x2={x + w} y2={y + h} stroke={GLASS_EDGE} strokeWidth={1} />
    <line x1={x + w} y1={y} x2={x} y2={y + h} stroke={GLASS_EDGE} strokeWidth={1} />
  </g>
)

const renderGrille: Renderer = (win, { x, y, w, h }) => {
  const spacing = Number(win.props.barSpacing) || 100
  const barsX = Math.max(2, Math.round(w / (spacing * 0.2)))
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#eceff1" stroke="#263238" strokeWidth={1.5} />
      {Array.from({ length: barsX - 1 }, (_, i) => (
        <line key={i} x1={x + (w / barsX) * (i + 1)} y1={y} x2={x + (w / barsX) * (i + 1)} y2={y + h} stroke="#37474f" strokeWidth={1.5} />
      ))}
    </g>
  )
}

const renderMeshScreen: Renderer = (_win, { x, y, w, h }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill="#eceff1" stroke={FRAME} strokeWidth={1.5} />
    <MeshOverlay x={x + 3} y={y + 3} w={w - 6} h={h - 6} />
  </g>
)

const renderRollerBlind: Renderer = (win, { x, y, w, h }) => {
  const n = Number(win.props.slatCount) || 8
  const sh = (h * 0.6) / n
  return (
    <g>
      {glassRect(x, y, w, h, '#fff8e1')}
      <rect x={x} y={y} width={w} height={10} fill="#8d6e63" />
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={x} y1={y + 10 + sh * i} x2={x + w} y2={y + 10 + sh * i} stroke="#bcaaa4" strokeWidth={1} />
      ))}
    </g>
  )
}

const renderFlyScreen: Renderer = renderMeshScreen

const renderFrostedFilm: Renderer = (win, { x, y, w, h }) => {
  const op = (Number(win.props.opacity) || 80) / 100
  return (
    <g>
      {glassRect(x, y, w, h)}
      <rect x={x} y={y} width={w} height={h} fill="#ffffff" opacity={op * 0.6} />
    </g>
  )
}

function renderGeneric(_win: SectionWindow, { x, y, w, h }: DrawCtx) {
  return glassRect(x, y, w, h)
}

function MeshOverlay({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const step = 6
  const vlines = Math.floor(w / step)
  const hlines = Math.floor(h / step)
  return (
    <g stroke="#94a3b8" strokeWidth={0.4} opacity={0.6}>
      {Array.from({ length: vlines }, (_, i) => (
        <line key={`v${i}`} x1={x + step * i} y1={y} x2={x + step * i} y2={y + h} />
      ))}
      {Array.from({ length: hlines }, (_, i) => (
        <line key={`h${i}`} x1={x} y1={y + step * i} x2={x + w} y2={y + step * i} />
      ))}
    </g>
  )
}

const RENDERERS: Partial<Record<WindowTypeId, Renderer>> = {
  fixed: renderFixed,
  sliding: renderSliding,
  casement: renderCasement,
  'double-casement': renderDoubleCasement,
  'fixed-casement': renderFixedCasement,
  tophung: renderTopHung,
  awning: renderAwning,
  louvered: renderLouvered,
  'door-single': renderDoorSingle,
  'door-double': renderDoorDouble,
  ventilator: renderVentilator,
  'exhaust-fan': renderExhaustFan,
  'exhaust-fan-rect': renderExhaustRect,
  'ac-sleeve': renderAcSleeve,
  'glass-block': renderGlassBlock,
  'georgian-bars': renderGeorgian,
  'roller-shutter': renderRollerShutter,
  skylight: renderSkylight,
  grille: renderGrille,
  'mesh-screen': renderMeshScreen,
  'roller-blind': renderRollerBlind,
  'fly-screen': renderFlyScreen,
  'frosted-film': renderFrostedFilm,
}
