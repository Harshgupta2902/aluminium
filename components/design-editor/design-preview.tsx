'use client'

import {
  computeShapeGeometry,
  type DesignDocument,
  type WindowShape,
} from '@/lib/design-editor/model'
import {
  isFrameDocument,
  type FrameDocument,
} from '@/lib/design-editor/frame-model'
import { renderWindow } from './window-renderers'

/**
 * Read-only thumbnail of a design document. Handles both the new section-based
 * FrameDocument and the legacy shape-based DesignDocument.
 */
export function DesignPreview({
  document,
  width = 240,
  height = 200,
}: {
  document: DesignDocument | FrameDocument | null
  width?: number
  height?: number
}) {
  if (isFrameDocument(document)) {
    return <FramePreview doc={document} width={width} height={height} />
  }
  return (
    <LegacyPreview doc={document as DesignDocument | null} width={width} height={height} />
  )
}

/* ---------- new frame renderer ---------- */

function FramePreview({ doc, width, height }: { doc: FrameDocument; width: number; height: number }) {
  const pad = 16
  const s = Math.min((width - pad * 2) / doc.width, (height - pad * 2) / doc.height)
  const fw = doc.width * s
  const fh = doc.height * s
  const offX = (width - fw) / 2
  const offY = (height - fh) / 2
  const px = (mm: number, axis: 'x' | 'y') => (axis === 'x' ? offX : offY) + mm * s

  return (
    <svg width={width} height={height} className="rounded bg-white">
      <rect x={offX} y={offY} width={fw} height={fh} fill="#f1f5f9" stroke="#64748b" strokeWidth={1.5} />
      {doc.sections.map((sec) => {
        const x = px(sec.sx, 'x')
        const y = px(sec.sy, 'y')
        const w = sec.sw * s
        const h = sec.sh * s
        return (
          <g key={sec.id}>
            {sec.window ? (
              renderWindow(sec.window, { x, y, w, h, glass: '#dbeafe' })
            ) : (
              <rect x={x} y={y} width={w} height={h} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={0.75} />
            )}
          </g>
        )
      })}
      {doc.dividers.map((d) => (
        <rect
          key={d.id}
          x={px(d.cx, 'x')}
          y={px(d.cy, 'y')}
          width={d.cw * s}
          height={d.ch * s}
          fill={d.kind === 'coupler' ? '#64748b' : '#94a3b8'}
        />
      ))}
    </svg>
  )
}

/* ---------- legacy shape renderer ---------- */

function LegacyPreview({ doc, width, height }: { doc: DesignDocument | null; width: number; height: number }) {
  const shapes = doc?.shapes ?? []
  if (shapes.length === 0) {
    return (
      <svg width={width} height={height} className="rounded bg-white">
        <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="central" className="fill-gray-400 text-xs">
          No windows
        </text>
      </svg>
    )
  }
  const bounds = computeBounds(shapes)
  const contentW = bounds.maxX - bounds.minX
  const contentH = bounds.maxY - bounds.minY
  const pad = 28
  const s = Math.min((width - pad * 2) / Math.max(1, contentW), (height - pad * 2) / Math.max(1, contentH))
  const offX = (width - contentW * s) / 2
  const offY = (height - contentH * s) / 2
  const px = (mm: number, axis: 'x' | 'y') => (axis === 'x' ? offX : offY) + (mm - (axis === 'x' ? bounds.minX : bounds.minY)) * s

  return (
    <svg width={width} height={height} className="rounded bg-white">
      {shapes.map((shape) => {
        const geo = computeShapeGeometry(shape)
        return (
          <g key={shape.id}>
            <rect x={px(geo.outer.x, 'x')} y={px(geo.outer.y, 'y')} width={geo.outer.width * s} height={geo.outer.height * s} className="fill-white stroke-gray-700" strokeWidth={1.5} />
            {geo.panels.map((panel) => (
              <rect key={panel.index} x={px(panel.rect.x, 'x')} y={px(panel.rect.y, 'y')} width={panel.rect.width * s} height={panel.rect.height * s} className="fill-emerald-100/70 stroke-gray-500" strokeWidth={0.75} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

function computeBounds(shapes: WindowShape[]) {
  if (shapes.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const s of shapes) {
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + s.width)
    maxY = Math.max(maxY, s.y + s.height)
  }
  return { minX, minY, maxX, maxY }
}
