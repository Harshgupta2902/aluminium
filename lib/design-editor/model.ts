/**
 * Window design editor — data model and pure geometry helpers.
 *
 * This module is framework-free (no React, no DOM). It describes a window
 * design and computes the geometry the SVG canvas renders: panel/sash
 * rectangles, mullion lines, opening indicators, and dimension lines.
 *
 * All real-world dimensions are in millimetres (mm). Rendering code maps
 * mm -> pixels using a scale factor.
 */

export type WindowTypeId =
  | 'sliding'
  | 'casement'
  | 'fixed'
  | 'door'

/** A concrete template the user can drop onto the canvas. */
export interface WindowTemplate {
  /** Stable template key, e.g. "sliding-3t". */
  key: string
  /** Short code shown on the thumbnail, e.g. "S3". */
  code: string
  /** Human label, e.g. "Sliding 3T". */
  label: string
  category: string
  type: WindowTypeId
  /** Number of vertical divisions (panels across the width). */
  panels: number
  /**
   * Which panels (0-indexed) are operable (open) vs fixed.
   * For sliding, operable panels slide; empty => all fixed.
   */
  operablePanels: number[]
  defaultWidth: number
  defaultHeight: number
}

/** The editable window instance placed on the canvas. */
export interface WindowShape {
  id: string
  templateKey: string
  type: WindowTypeId
  label: string
  /** Index number shown in the center circle (1, 2, ...). */
  index: number
  width: number
  height: number
  panels: number
  operablePanels: number[]
  /** Top-left position on the canvas, in mm. */
  x: number
  y: number
}

/** Design-level details captured in the right-hand panel. */
export interface DesignDetails {
  designRef: string
  designName: string
  price: number | null
  quantity: number
  unitPrice: boolean
  colour: string
  location: string
  floorNo: string
  glassType: string
  message: string
}

export interface DesignDocument {
  id: string | null
  details: DesignDetails
  shapes: WindowShape[]
}

/* ------------------------------------------------------------------ *
 * Template catalog
 * ------------------------------------------------------------------ */

const DEFAULT_W = 1000
const DEFAULT_H = 1000

function slidingTemplate(panels: number): WindowTemplate {
  // In a sliding window the outer panels are typically fixed and the inner
  // ones slide; keep it simple: alternate panels are operable.
  const operablePanels: number[] = []
  for (let i = 0; i < panels; i++) {
    if (i % 2 === 1 || (panels === 2 && i === 0)) operablePanels.push(i)
  }
  return {
    key: `sliding-${panels}t`,
    code: `S${panels}`,
    label: `Sliding ${panels}T`,
    category: 'Sliding Windows',
    type: 'sliding',
    panels,
    operablePanels,
    defaultWidth: DEFAULT_W,
    defaultHeight: DEFAULT_H,
  }
}

export const TEMPLATE_CATEGORIES: {
  category: string
  templates: WindowTemplate[]
}[] = [
  {
    category: 'Sliding Windows',
    templates: [
      slidingTemplate(2),
      slidingTemplate(3),
      slidingTemplate(4),
      slidingTemplate(5),
      slidingTemplate(6),
    ],
  },
  {
    category: 'Casement Windows',
    templates: [
      {
        key: 'casement-1',
        code: 'C1',
        label: 'Casement 1',
        category: 'Casement Windows',
        type: 'casement',
        panels: 1,
        operablePanels: [0],
        defaultWidth: 600,
        defaultHeight: 1000,
      },
      {
        key: 'casement-2',
        code: 'C2',
        label: 'Casement 2',
        category: 'Casement Windows',
        type: 'casement',
        panels: 2,
        operablePanels: [0, 1],
        defaultWidth: 1000,
        defaultHeight: 1000,
      },
      {
        key: 'casement-3',
        code: 'C3',
        label: 'Casement 3',
        category: 'Casement Windows',
        type: 'casement',
        panels: 3,
        operablePanels: [0, 2],
        defaultWidth: 1500,
        defaultHeight: 1000,
      },
    ],
  },
  {
    category: 'Fixed Windows',
    templates: [
      {
        key: 'fixed-1',
        code: 'F1',
        label: 'Fixed',
        category: 'Fixed Windows',
        type: 'fixed',
        panels: 1,
        operablePanels: [],
        defaultWidth: DEFAULT_W,
        defaultHeight: DEFAULT_H,
      },
      {
        key: 'fixed-2',
        code: 'F2',
        label: 'Fixed 2',
        category: 'Fixed Windows',
        type: 'fixed',
        panels: 2,
        operablePanels: [],
        defaultWidth: 1400,
        defaultHeight: 1000,
      },
    ],
  },
  {
    category: 'Doors',
    templates: [
      {
        key: 'door-1',
        code: 'D1',
        label: 'Door',
        category: 'Doors',
        type: 'door',
        panels: 1,
        operablePanels: [0],
        defaultWidth: 900,
        defaultHeight: 2100,
      },
      {
        key: 'door-2',
        code: 'D2',
        label: 'Door 2',
        category: 'Doors',
        type: 'door',
        panels: 2,
        operablePanels: [0, 1],
        defaultWidth: 1500,
        defaultHeight: 2100,
      },
    ],
  },
]

export const ALL_TEMPLATES: WindowTemplate[] = TEMPLATE_CATEGORIES.flatMap(
  (c) => c.templates
)

export function findTemplate(key: string): WindowTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.key === key)
}

/**
 * Return a sensible default editor template for a raw window type string
 * (e.g. a DB value like "sliding", "casement", "fixed", "door"). Falls back
 * to a 2-track sliding window when the type is unknown.
 */
export function defaultTemplateForType(
  type: string | null | undefined
): WindowTemplate {
  const normalized = (type ?? '').toLowerCase()
  const match = ALL_TEMPLATES.find((t) => t.type === normalized)
  return match ?? findTemplate('sliding-2t')!
}

/** Build a fresh WindowShape from a template. */
export function shapeFromTemplate(
  template: WindowTemplate,
  index: number,
  position: { x: number; y: number } = { x: 0, y: 0 }
): WindowShape {
  return {
    id: makeId(),
    templateKey: template.key,
    type: template.type,
    label: template.label,
    index,
    width: template.defaultWidth,
    height: template.defaultHeight,
    panels: template.panels,
    operablePanels: [...template.operablePanels],
    x: position.x,
    y: position.y,
  }
}

/* ------------------------------------------------------------------ *
 * Geometry — computed in mm, independent of zoom/scale
 * ------------------------------------------------------------------ */

/** Outer frame thickness, in mm, used for drawing the frame band. */
export const FRAME_MM = 45
/** Mullion (divider between panels) thickness, in mm. */
export const MULLION_MM = 30

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface PanelGeometry {
  index: number
  rect: Rect
  operable: boolean
  /**
   * Direction the opening indicator points for casement/door panels.
   * 'left' | 'right' hinge side; null for sliding/fixed.
   */
  hinge: 'left' | 'right' | null
}

export interface ShapeGeometry {
  /** Outer bounds of the window (mm, relative to shape.x/shape.y). */
  outer: Rect
  /** Inner glass area after the frame band. */
  inner: Rect
  panels: PanelGeometry[]
  /** Vertical mullion x-positions (mm) between panels. */
  mullions: number[]
}

/**
 * Compute panel rectangles and mullions for a shape. Coordinates are in mm,
 * with the shape's top-left at (shape.x, shape.y).
 */
export function computeShapeGeometry(shape: WindowShape): ShapeGeometry {
  const outer: Rect = {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
  }

  const inner: Rect = {
    x: shape.x + FRAME_MM,
    y: shape.y + FRAME_MM,
    width: Math.max(0, shape.width - 2 * FRAME_MM),
    height: Math.max(0, shape.height - 2 * FRAME_MM),
  }

  const panelCount = Math.max(1, shape.panels)
  const totalMullions = panelCount - 1
  const mullionsWidth = totalMullions * MULLION_MM
  const panelWidth =
    panelCount > 0 ? (inner.width - mullionsWidth) / panelCount : inner.width

  const panels: PanelGeometry[] = []
  const mullions: number[] = []

  let cursor = inner.x
  for (let i = 0; i < panelCount; i++) {
    const rect: Rect = {
      x: cursor,
      y: inner.y,
      width: panelWidth,
      height: inner.height,
    }
    const operable = shape.operablePanels.includes(i)

    let hinge: 'left' | 'right' | null = null
    if ((shape.type === 'casement' || shape.type === 'door') && operable) {
      // Hinge on the outer edge: left panels hinge left, right panels right.
      hinge = i < panelCount / 2 ? 'left' : 'right'
    }

    panels.push({ index: i, rect, operable, hinge })

    cursor += panelWidth
    if (i < panelCount - 1) {
      mullions.push(cursor + MULLION_MM / 2)
      cursor += MULLION_MM
    }
  }

  return { outer, inner, panels, mullions }
}

/* ------------------------------------------------------------------ *
 * Misc helpers
 * ------------------------------------------------------------------ */

/**
 * Short unique id without pulling in a uuid dependency.
 *
 * IMPORTANT: this must be prerender-safe. Under Next.js 16 Cache Components,
 * calling `Date.now()` / `Math.random()` during a server prerender throws a
 * build error and also causes server/client hydration mismatches. So the id
 * is derived from a monotonic in-process counter, which is deterministic on
 * the server render and stable across hydration.
 *
 * For cross-session uniqueness (e.g. before persisting to the DB), re-id
 * shapes on the client with `makeClientId()`.
 */
let __idCounter = 0

export function makeId(): string {
  __idCounter += 1
  return `s${__idCounter.toString(36)}`
}

/**
 * Client-only id generator. Safe to use in effects / event handlers that only
 * run in the browser (never during a server prerender). Prefers the platform
 * UUID when available and falls back to the deterministic counter.
 */
export function makeClientId(): string {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto?.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID()
  }
  return makeId()
}

export function emptyDetails(): DesignDetails {
  return {
    designRef: 'W1',
    designName: '',
    price: null,
    quantity: 1,
    unitPrice: false,
    colour: 'White',
    location: '',
    floorNo: '',
    glassType: '',
    message: '',
  }
}

export const COLOUR_OPTIONS = [
  'White',
  'Black',
  'Grey',
  'Brown',
  'Bronze',
  'Wood Finish',
  'Anodized',
]

export const GLASS_TYPE_OPTIONS = [
  '4MM CLEAR GLASS',
  '5MM CLEAR GLASS',
  '5MM CLEAR TOUGHENED GLASS',
  '6MM TINTED GLASS',
  '6MM TOUGHENED GLASS',
  '8MM TOUGHENED GLASS',
  'DOUBLE GLAZED UNIT',
]
