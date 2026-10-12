'use client'

import {
  computeShapeGeometry,
  shapeFromTemplate,
  type WindowTemplate,
} from '@/lib/design-editor/model'

/**
 * Small thumbnail of a template for the sidebar flyout. Renders the same
 * panel geometry the canvas uses, scaled to fit a fixed box.
 */
export function MiniTemplatePreview({
  template,
  size = 56,
}: {
  template: WindowTemplate
  size?: number
}) {
  const shape = shapeFromTemplate(template, 0)
  const geo = computeShapeGeometry(shape)

  const pad = 4
  const inner = size - pad * 2
  const sx = inner / shape.width
  const sy = inner / shape.height
  const s = Math.min(sx, sy)

  // Center within the box.
  const drawW = shape.width * s
  const drawH = shape.height * s
  const offX = pad + (inner - drawW) / 2
  const offY = pad + (inner - drawH) / 2

  const px = (mm: number, origin: number, off: number) =>
    off + (mm - origin) * s

  return (
    <svg width={size} height={size} className="rounded border bg-white">
      {/* Outer frame */}
      <rect
        x={px(geo.outer.x, shape.x, offX)}
        y={px(geo.outer.y, shape.y, offY)}
        width={geo.outer.width * s}
        height={geo.outer.height * s}
        className="fill-white stroke-gray-700"
        strokeWidth={1.5}
      />
      {geo.panels.map((panel) => (
        <rect
          key={panel.index}
          x={px(panel.rect.x, shape.x, offX)}
          y={px(panel.rect.y, shape.y, offY)}
          width={panel.rect.width * s}
          height={panel.rect.height * s}
          className="fill-emerald-100/70 stroke-gray-500"
          strokeWidth={0.75}
        />
      ))}
    </svg>
  )
}
