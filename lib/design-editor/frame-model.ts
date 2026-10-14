/**
 * Section-based window design model (professional editor).
 *
 * A design is a FRAME (the opening) subdivided into SECTIONS by COUPLERS
 * (structural splits) and MULLIONS (lighter dividers inside coupler sections).
 * Each section can hold one window TYPE with its own properties.
 *
 * Coordinates: everything is stored in millimetres. Rendering scales mm -> px.
 * This mirrors the reference editor (design.softwinquote.com) model.
 */

/* ------------------------------------------------------------------ *
 * Window type catalog
 * ------------------------------------------------------------------ */

export type WindowTypeId =
  | 'fixed'
  | 'sliding'
  | 'casement'
  | 'double-casement'
  | 'fixed-casement'
  | 'tophung'
  | 'louvered'
  | 'awning'
  | 'door-single'
  | 'door-double'
  | 'ventilator'
  | 'exhaust-fan'
  | 'exhaust-fan-rect'
  | 'ac-sleeve'
  | 'glass-block'
  | 'georgian-bars'
  | 'roller-shutter'
  | 'skylight'
  | 'grille'
  | 'mesh-screen'
  | 'roller-blind'
  | 'fly-screen'
  | 'frosted-film'

export interface WindowTypeDef {
  id: WindowTypeId
  label: string
  icon: string
  /** Stroke + fill accent used in the catalog chip and drawings. */
  stroke: string
  fill: string
  category: string
  /** Factory for the default props of a freshly placed window of this type. */
  defaults: () => Record<string, unknown>
}

/* Default-prop factories (from the reference `Av`). */
const defaults: Record<WindowTypeId, () => Record<string, unknown>> = {
  fixed: () => ({
    grids: 'none',
    gridDivX: 2,
    gridDivY: 2,
    tint: 'clear',
    frameProfile: 'standard',
    obscure: false,
  }),
  sliding: () => ({
    panels: 2,
    // Per-panel direction: 'left' | 'right' (sliding) or 'fixed' (non-opening).
    panelDirs: ['right', 'left'],
    // Per-panel handle position for sliding panels: 'left' | 'right'.
    panelHandles: ['right', 'left'],
    // Per-panel accessory selections, index-aligned with panels.
    // Each entry: { sash?, interlock?, handle?, roller?, lock? } of {id,name,price}.
    panelAccessories: [],
    direction: 'both',
    handleSide: 'center',
    mesh: false,
    slimProfile: false,
  }),
  casement: () => ({
    hingeSide: 'left',
    openDir: 'outward',
    openAngle: 90,
    handleType: 'lever',
    glazingBar: false,
    barDiv: 2,
    secLock: false,
  }),
  'double-casement': () => ({
    openDir: 'outward',
    openAngle: 90,
    handleType: 'lever',
    glazingBar: false,
    barDiv: 2,
  }),
  'fixed-casement': () => ({ tint: 'clear', glazingBar: false, barDiv: 2 }),
  tophung: () => ({
    openDir: 'outward',
    openAngle: 45,
    stay: false,
    frictionHinge: false,
  }),
  louvered: () => ({ blades: 6, bladeAngle: 30 }),
  awning: () => ({ openDir: 'outward', openAngle: 40, stay: true }),
  'door-single': () => ({
    hingeSide: 'left',
    openDir: 'inward',
    panelStyle: 'panel',
    handleType: 'lever',
    lockType: 'mortise',
    closer: false,
    threshold: 'standard',
    visionPanel: false,
  }),
  'door-double': () => ({
    openDir: 'inward',
    panelStyle: 'panel',
    activeLeaf: 'both',
    handleType: 'lever',
    lockType: 'mortise',
    closer: false,
    transom: false,
    transomH: 300,
  }),
  ventilator: () => ({ rows: 3, cols: 5, brickColor: 'terracotta' }),
  'exhaust-fan': () => ({ blades: 4, running: false }),
  'exhaust-fan-rect': () => ({ blades: 4, diameterMm: null }),
  'ac-sleeve': () => ({ louverCount: 5, brand: '' }),
  'glass-block': () => ({ rows: 2, cols: 4, frosted: true }),
  'georgian-bars': () => ({ gridDivX: 3, gridDivY: 2 }),
  'roller-shutter': () => ({ slatCount: 12, position: 'closed' }),
  skylight: () => ({ openable: false, tint: 'clear' }),
  grille: () => ({ pattern: 'straight', barSpacing: 100, decorative: false }),
  'mesh-screen': () => ({ meshSize: 'fine', frameColor: 'grey' }),
  'roller-blind': () => ({ slatCount: 8, position: 'closed', motorized: false }),
  'fly-screen': () => ({ meshSize: 'fine' }),
  'frosted-film': () => ({ opacity: 80, pattern: 'uniform' }),
}

/** The full window-type catalog, mirroring the reference `ip`. */
export const WINDOW_TYPES: WindowTypeDef[] = [
  t('fixed', 'Fixed Window', 'FX', '#455a64', '#e3f2fd', 'Windows'),
  t('sliding', 'Sliding Window', 'SL', '#37474f', '#eef3f6', 'Windows'),
  t('casement', 'Casement Window', 'CS', '#4a4030', '#fff3e0', 'Windows'),
  t('double-casement', 'Double Casement', 'DC', '#4a4030', '#fff3e0', 'Windows'),
  t('fixed-casement', 'Fixed Casement', 'FC', '#4a4030', '#fff3e0', 'Windows'),
  t('tophung', 'Top Hung Window', 'TH', '#4a3030', '#fbe9e7', 'Windows'),
  t('louvered', 'Louvered Window', 'LV', '#3d3050', '#f3e5f5', 'Windows'),
  t('awning', 'Awning Window', 'AW', '#2a4040', '#e0f7fa', 'Windows'),
  t('door-single', 'Single Door', 'D1', '#2d3a4a', '#e8eaf6', 'Doors'),
  t('door-double', 'Double Door', 'D2', '#2d3a4a', '#e8eaf6', 'Doors'),
  t('ventilator', 'Brick Ventilator', 'BV', '#5d4037', '#efebe9', 'Ventilation'),
  t('exhaust-fan', 'Exhaust Fan', 'EF', '#263238', '#eceff1', 'Ventilation'),
  t('exhaust-fan-rect', 'Rectangle Exhaust', 'RE', '#263238', '#eceff1', 'Ventilation'),
  t('ac-sleeve', 'AC Sleeve', 'AC', '#1a3a5c', '#e3f2fd', 'Ventilation'),
  t('glass-block', 'Glass Block Wall', 'GB', '#455a64', '#e1f5fe', 'Special'),
  t('georgian-bars', 'Georgian Bars', 'GG', '#4a5568', '#edf2f7', 'Special'),
  t('roller-shutter', 'Roller Shutter', 'RS', '#37474f', '#eceff1', 'Special'),
  t('skylight', 'Skylight', 'SK', '#2a4040', '#e0f7fa', 'Special'),
  t('grille', 'Iron Grille', 'IG', '#263238', '#eceff1', 'Special'),
  t('mesh-screen', 'Mesh Screen', 'MS', '#37474f', '#eceff1', 'Screens'),
  t('roller-blind', 'Roller Blind', 'RB', '#4a4030', '#fff8e1', 'Screens'),
  t('fly-screen', 'Fly Screen', 'FS', '#2a4040', '#e8f5e9', 'Screens'),
  t('frosted-film', 'Frosted Film', 'FF', '#455a64', '#f5f5f5', 'Screens'),
]

function t(
  id: WindowTypeId,
  label: string,
  icon: string,
  stroke: string,
  fill: string,
  category: string
): WindowTypeDef {
  return { id, label, icon, stroke, fill, category, defaults: defaults[id] }
}

export const WINDOW_TYPE_MAP: Record<string, WindowTypeDef> = Object.fromEntries(
  WINDOW_TYPES.map((w) => [w.id, w])
)

/** Window types allowed inside a mullion-divided section. */
export const MULLION_ALLOWED_TYPES: WindowTypeId[] = [
  'casement',
  'fixed',
  'louvered',
  'fixed-casement',
]

export const WINDOW_CATEGORIES = Array.from(
  WINDOW_TYPES.reduce((map, w) => {
    const list = map.get(w.category) ?? []
    list.push(w)
    map.set(w.category, list)
    return map
  }, new Map<string, WindowTypeDef[]>())
).map(([category, types]) => ({ category, types }))

/* ------------------------------------------------------------------ *
 * Document model
 * ------------------------------------------------------------------ */

export interface SectionWindow {
  type: WindowTypeId
  props: Record<string, unknown>
}

/** A rectangular region of the frame, in mm. */
export interface FrameSection {
  id: number
  idx: number
  /** mm, relative to the frame's inner origin. */
  sx: number
  sy: number
  sw: number
  sh: number
  window: SectionWindow | null
  /** True when this section was produced by a mullion split (restricts drops). */
  createdByMullion?: boolean
}

export interface Divider {
  id: number
  orient: 'v' | 'h'
  /** mm position + extent. */
  cx: number
  cy: number
  cw: number
  ch: number
  /** 'coupler' (structural) or 'mullion' (inside a coupler section). */
  kind: 'coupler' | 'mullion'
}

export interface FrameDetails {
  designRef: string
  designName: string
  ratePerSqft: number | null
  quantity: number
  colour: string
  glassType: string
  location: string
  floorNo: string
  message: string
  /** Selected GI hardware (names), applied design-wide for sliding sections. */
  track?: string
  sash?: string
  interlock?: string
  lock?: string
}

export interface FrameDocument {
  id: string | null
  /** Schema marker so we can distinguish from the legacy shape model. */
  kind: 'frame'
  /** Overall opening size in mm. */
  width: number
  height: number
  details: FrameDetails
  sections: FrameSection[]
  dividers: Divider[]
}

/* ------------------------------------------------------------------ *
 * Constants (reference parity)
 * ------------------------------------------------------------------ */

export const COUPLER_MM = 48 // structural divider thickness
export const MULLION_MM = 30 // lighter divider thickness
export const FRAME_MM = 45 // outer frame band
export const MIN_SECTION_MM = 150 // reject splits that leave < this

export const DEFAULT_FRAME_W = 1500
export const DEFAULT_FRAME_H = 1200

/* ------------------------------------------------------------------ *
 * Id generation (prerender-safe counter + client UUID)
 * ------------------------------------------------------------------ */

let __counter = 100
export function nextId(): number {
  return ++__counter
}
export function bumpCounter(toAtLeast: number) {
  __counter = Math.max(__counter, toAtLeast)
}

/* ------------------------------------------------------------------ *
 * Document helpers
 * ------------------------------------------------------------------ */

export function emptyFrameDetails(): FrameDetails {
  return {
    designRef: 'W1',
    designName: '',
    ratePerSqft: null,
    quantity: 1,
    colour: 'White',
    glassType: '',
    location: '',
    floorNo: '',
    message: '',
  }
}

/** A fresh single-section frame of the given size. */
export function createFrameDocument(
  width = DEFAULT_FRAME_W,
  height = DEFAULT_FRAME_H
): FrameDocument {
  return {
    id: null,
    kind: 'frame',
    width,
    height,
    details: emptyFrameDetails(),
    sections: [
      {
        id: nextId(),
        idx: 1,
        sx: 0,
        sy: 0,
        sw: width,
        sh: height,
        window: null,
      },
    ],
    dividers: [],
  }
}

/** Renumber section idx values 1..n (top-left reading order). */
export function renumber(doc: FrameDocument): FrameDocument {
  const ordered = [...doc.sections].sort((a, b) =>
    a.sy === b.sy ? a.sx - b.sx : a.sy - b.sy
  )
  ordered.forEach((s, i) => (s.idx = i + 1))
  return doc
}

function cloneDoc(doc: FrameDocument): FrameDocument {
  return {
    ...doc,
    details: { ...doc.details },
    sections: doc.sections.map((s) => ({
      ...s,
      window: s.window
        ? { type: s.window.type, props: { ...s.window.props } }
        : null,
    })),
    dividers: doc.dividers.map((d) => ({ ...d })),
  }
}

export interface SplitResult {
  ok: boolean
  msg: string
  doc?: FrameDocument
}

/**
 * Find the section containing point (x, y) in mm.
 */
export function sectionAt(
  doc: FrameDocument,
  x: number,
  y: number
): FrameSection | null {
  return (
    doc.sections.find(
      (s) => x > s.sx && x < s.sx + s.sw && y > s.sy && y < s.sy + s.sh
    ) ?? null
  )
}

/**
 * Split the section containing (x, y) with a divider.
 *   orient 'v' -> vertical bar at x, splitting into left/right.
 *   orient 'h' -> horizontal bar at y, splitting into top/bottom.
 * kind 'coupler' may not be placed inside a mullion section.
 */
export function splitSection(
  doc: FrameDocument,
  orient: 'v' | 'h',
  x: number,
  y: number,
  kind: 'coupler' | 'mullion'
): SplitResult {
  const target = sectionAt(doc, x, y)
  if (!target) return { ok: false, msg: 'Drop onto a section' }

  if (kind === 'coupler' && target.createdByMullion) {
    return { ok: false, msg: 'Cannot place a coupler inside a mullion section' }
  }
  if (kind === 'mullion' && !target.createdByMullion && !target.window) {
    // Mullions are meant for coupler sections; allow on any empty section too,
    // but the reference restricts couplers-in-mullions (handled above).
  }

  const thickness = kind === 'coupler' ? COUPLER_MM : MULLION_MM
  const half = thickness / 2
  const next = cloneDoc(doc)
  const sections = next.sections.filter((s) => s.id !== target.id)

  if (orient === 'v') {
    const leftW = x - target.sx - half
    const rightW = target.sx + target.sw - x - half
    if (leftW < MIN_SECTION_MM || rightW < MIN_SECTION_MM) {
      return { ok: false, msg: 'Too close to the edge' }
    }
    sections.push(
      mkSection(target, { sx: target.sx, sw: leftW }, kind),
      mkSection(target, { sx: x + half, sw: rightW }, kind)
    )
    next.dividers.push({
      id: nextId(),
      orient: 'v',
      cx: x - half,
      cy: target.sy,
      cw: thickness,
      ch: target.sh,
      kind,
    })
  } else {
    const topH = y - target.sy - half
    const botH = target.sy + target.sh - y - half
    if (topH < MIN_SECTION_MM || botH < MIN_SECTION_MM) {
      return { ok: false, msg: 'Too close to the edge' }
    }
    sections.push(
      mkSection(target, { sy: target.sy, sh: topH }, kind),
      mkSection(target, { sy: y + half, sh: botH }, kind)
    )
    next.dividers.push({
      id: nextId(),
      orient: 'h',
      cx: target.sx,
      cy: y - half,
      cw: target.sw,
      ch: thickness,
      kind,
    })
  }

  next.sections = sections
  renumber(next)
  return { ok: true, msg: 'Section split', doc: next }
}

function mkSection(
  base: FrameSection,
  patch: Partial<Pick<FrameSection, 'sx' | 'sy' | 'sw' | 'sh'>>,
  kind: 'coupler' | 'mullion'
): FrameSection {
  return {
    id: nextId(),
    idx: 0,
    sx: base.sx,
    sy: base.sy,
    sw: base.sw,
    sh: base.sh,
    window: null,
    createdByMullion: kind === 'mullion' ? true : base.createdByMullion,
    ...patch,
  }
}

/** Place (or replace) a window in a section. Enforces mullion-section rules. */
export function placeWindow(
  doc: FrameDocument,
  sectionId: number,
  type: WindowTypeId
): SplitResult {
  const target = doc.sections.find((s) => s.id === sectionId)
  if (!target) return { ok: false, msg: 'Section not found' }
  if (target.createdByMullion && !MULLION_ALLOWED_TYPES.includes(type)) {
    return {
      ok: false,
      msg: 'Only casement, fixed or louvered windows fit a mullion section',
    }
  }
  const next = cloneDoc(doc)
  const sec = next.sections.find((s) => s.id === sectionId)!
  const props = WINDOW_TYPE_MAP[type].defaults()
  if (type === 'sliding') normalizeSlidingPanels(props)
  sec.window = { type, props }
  return { ok: true, msg: `${WINDOW_TYPE_MAP[type].label} placed`, doc: next }
}

/** Clear the window from a section. */
export function clearSection(
  doc: FrameDocument,
  sectionId: number
): FrameDocument {
  const next = cloneDoc(doc)
  const sec = next.sections.find((s) => s.id === sectionId)
  if (sec) sec.window = null
  return next
}

/** Patch a section window's props. */
export function updateWindowProps(
  doc: FrameDocument,
  sectionId: number,
  patch: Record<string, unknown>
): FrameDocument {
  const next = cloneDoc(doc)
  const sec = next.sections.find((s) => s.id === sectionId)
  if (sec?.window) sec.window.props = { ...sec.window.props, ...patch }
  return next
}

/* ------------------------------------------------------------------ *
 * Per-panel (palla) model for sliding windows
 * ------------------------------------------------------------------ */

/** Direction/mode of a single sliding panel. */
export type PanelDir = 'left' | 'right' | 'fixed'

/** A single accessory choice stored on a panel. */
export interface PanelAccessory {
  id: string
  name: string
  price: number
}

/** Per-panel accessory map (index-aligned with panels). */
export type PanelAccessories = Partial<Record<string, PanelAccessory>>

/** Accessory kinds a sliding panel can carry. */
export const PANEL_ACCESSORY_KINDS = [
  'sash',
  'interlock',
  'handle',
  'roller',
  'lock',
] as const
export type PanelAccessoryKind = (typeof PANEL_ACCESSORY_KINDS)[number]

/**
 * Normalise a sliding window's per-panel arrays so they always match the panel
 * count. Mutates and returns the same props object. Safe to call repeatedly.
 */
export function normalizeSlidingPanels(
  props: Record<string, unknown>
): Record<string, unknown> {
  const panels = Math.max(1, Number(props.panels) || 2)

  const dirs = Array.isArray(props.panelDirs) ? [...(props.panelDirs as PanelDir[])] : []
  const handles = Array.isArray(props.panelHandles)
    ? [...(props.panelHandles as ('left' | 'right')[])]
    : []
  const acc = Array.isArray(props.panelAccessories)
    ? [...(props.panelAccessories as PanelAccessories[])]
    : []

  for (let i = 0; i < panels; i++) {
    if (dirs[i] == null) dirs[i] = i % 2 === 0 ? 'right' : 'left'
    if (handles[i] == null) handles[i] = i % 2 === 0 ? 'right' : 'left'
    if (acc[i] == null) acc[i] = {}
  }
  dirs.length = panels
  handles.length = panels
  acc.length = panels

  props.panelDirs = dirs
  props.panelHandles = handles
  props.panelAccessories = acc
  return props
}

/** Normalise every sliding section in a document (used on load). */
export function normalizeDocumentPanels(doc: FrameDocument): FrameDocument {
  for (const s of doc.sections) {
    if (s.window?.type === 'sliding') normalizeSlidingPanels(s.window.props)
  }
  return doc
}

export function updateFrameDetails(
  doc: FrameDocument,
  patch: Partial<FrameDetails>
): FrameDocument {
  const next = cloneDoc(doc)
  next.details = { ...next.details, ...patch }
  return next
}

export function resizeFrame(
  doc: FrameDocument,
  width: number,
  height: number
): FrameDocument {
  // Only allow resize on a single, undivided section (fresh frame) to keep
  // geometry consistent; otherwise scale sections proportionally.
  const next = cloneDoc(doc)
  const sx = width / doc.width
  const sy = height / doc.height
  next.width = width
  next.height = height
  next.sections = next.sections.map((s) => ({
    ...s,
    sx: Math.round(s.sx * sx),
    sy: Math.round(s.sy * sy),
    sw: Math.round(s.sw * sx),
    sh: Math.round(s.sh * sy),
  }))
  next.dividers = next.dividers.map((d) => ({
    ...d,
    cx: Math.round(d.cx * sx),
    cy: Math.round(d.cy * sy),
    cw: d.orient === 'v' ? d.cw : Math.round(d.cw * sx),
    ch: d.orient === 'h' ? d.ch : Math.round(d.ch * sy),
  }))
  return next
}

/** Re-sync the id counter from a loaded document so new ids stay unique. */
export function syncCounter(doc: FrameDocument) {
  let max = 100
  for (const s of doc.sections) max = Math.max(max, s.id)
  for (const d of doc.dividers) max = Math.max(max, d.id)
  bumpCounter(max)
}

/** Type guard: is this a new frame document (vs legacy shape model)? */
export function isFrameDocument(doc: unknown): doc is FrameDocument {
  return (
    !!doc &&
    typeof doc === 'object' &&
    (doc as { kind?: string }).kind === 'frame'
  )
}
