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
  | 'window-ac'
  | 'rectangle'
  | 'door-open-bottom'
  | 'custom-image'

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
    // Per-panel width fractions of the section width (sum = 1).
    panelFractions: [0.5, 0.5],
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
  'window-ac': () => ({ brand: '' }),
  rectangle: () => ({ label: '' }),
  'door-open-bottom': () => ({ hingeSide: 'left', openDir: 'inward', panelStyle: 'glass' }),
  'custom-image': () => ({ src: '' }),
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
  t('window-ac', 'Window AC', 'AC', '#1a3a5c', '#e3f2fd', 'Ventilation'),
  t('rectangle', 'Rectangle Frame', 'R3', '#455a64', '#eef2f7', 'Special'),
  t('door-open-bottom', 'Open Bottom Door', 'OB', '#2d3a4a', '#e8eaf6', 'Doors'),
  t('custom-image', 'Custom Image', 'IMG', '#455a64', '#f5f5f5', 'Special'),
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
 * Preset catalog (reference parity)
 * ------------------------------------------------------------------ *
 * The reference tool rail is a set of PRESETS grouped into panels. Most are
 * just a base window type + override props (e.g. "Sliding 3T" = sliding with
 * panels:3). We mirror that so the rail shows the same items without needing a
 * unique renderer per label.
 */

export interface WindowPreset {
  id: string
  label: string
  badge: string
  /** Base renderer type. */
  type: WindowTypeId
  /** Props merged over the type defaults when placed. */
  props?: Record<string, unknown>
  /** Suggested size (used for standalone drops / previews). */
  wmm?: number
  hmm?: number
}

export interface PresetGroup {
  group: string
  presets: WindowPreset[]
}

export const WINDOW_PRESET_GROUPS: PresetGroup[] = [
  {
    group: 'Windows',
    presets: [
      { id: 'fixed', label: 'Fixed Window', badge: 'FX', type: 'fixed', wmm: 900, hmm: 1000 },
      { id: 'sliding', label: 'Sliding Window', badge: 'SL', type: 'sliding', props: { panels: 2 }, wmm: 1200, hmm: 1000 },
      { id: 'casement', label: 'Casement Window', badge: 'CS', type: 'casement', wmm: 600, hmm: 1200 },
      { id: 'double-casement', label: 'Double Casement', badge: 'DC', type: 'double-casement', wmm: 1200, hmm: 1200 },
      { id: 'fixed-casement', label: 'Fixed Casement', badge: 'FC', type: 'fixed-casement', wmm: 1200, hmm: 1200 },
      { id: 'tophung', label: 'Top Hung Window', badge: 'TH', type: 'tophung', wmm: 900, hmm: 600 },
      { id: 'louvered', label: 'Louvered Window', badge: 'LV', type: 'louvered', wmm: 800, hmm: 1200 },
      { id: 'awning', label: 'Awning Window', badge: 'AW', type: 'awning', wmm: 900, hmm: 600 },
    ],
  },
  {
    group: 'Casement Windows',
    presets: [
      { id: 'cs-left', label: 'Left Window', badge: 'LW', type: 'casement', props: { hingeSide: 'left' }, wmm: 600, hmm: 1200 },
      { id: 'cs-right', label: 'Right Window', badge: 'RW', type: 'casement', props: { hingeSide: 'right' }, wmm: 600, hmm: 1200 },
      { id: 'french-window', label: 'French Window', badge: 'FW', type: 'double-casement', wmm: 1200, hmm: 1800 },
      { id: 'tilt-turn', label: 'Tilt and Turn', badge: 'TT', type: 'casement', props: { handleType: 'tilt' }, wmm: 700, hmm: 1300 },
      { id: 'bottom-hung', label: 'Bottom Hung', badge: 'BH', type: 'tophung', props: { openDir: 'inward' }, wmm: 900, hmm: 600 },
      { id: 'fanlight', label: 'Fanlight', badge: 'FL', type: 'fixed', props: { grids: 'none' }, wmm: 900, hmm: 400 },
    ],
  },
  {
    group: 'Sliding Windows',
    presets: [
      { id: 'sliding-2t', label: 'Sliding 2T', badge: 'SL', type: 'sliding', props: { panels: 2 }, wmm: 1200, hmm: 1000 },
      { id: 'sliding-3t', label: 'Sliding 3T', badge: 'S3', type: 'sliding', props: { panels: 3 }, wmm: 1800, hmm: 1000 },
      { id: 'sliding-4t', label: 'Sliding 4T', badge: 'S4', type: 'sliding', props: { panels: 4 }, wmm: 2400, hmm: 1000 },
      { id: 'sliding-5t', label: 'Sliding 5T', badge: 'S5', type: 'sliding', props: { panels: 5 }, wmm: 3000, hmm: 1000 },
      { id: 'sliding-6t', label: 'Sliding 6T', badge: 'S6', type: 'sliding', props: { panels: 6 }, wmm: 3600, hmm: 1000 },
    ],
  },
  {
    group: 'Slim Windows',
    presets: [
      { id: 'slim-2t', label: 'Slim Sliding 2T', badge: 'SS', type: 'sliding', props: { panels: 2, slimProfile: true }, wmm: 1200, hmm: 1000 },
      { id: 'slim-3t', label: 'Slim Sliding 3T', badge: 'SS', type: 'sliding', props: { panels: 3, slimProfile: true }, wmm: 1800, hmm: 1000 },
      { id: 'slim-4t', label: 'Slim Sliding 4T', badge: 'SS', type: 'sliding', props: { panels: 4, slimProfile: true }, wmm: 2400, hmm: 1000 },
    ],
  },
  {
    group: 'Doors',
    presets: [
      { id: 'door-single', label: 'Single Door', badge: 'D1', type: 'door-single', wmm: 900, hmm: 2100 },
      { id: 'door-double', label: 'Double Door', badge: 'D2', type: 'door-double', wmm: 1500, hmm: 2100 },
      { id: 'louvered-door', label: 'Louvered Door', badge: 'LVD', type: 'louvered', props: { blades: 12 }, wmm: 900, hmm: 2100 },
      { id: 'door-open-bottom', label: 'Open Bottom Door', badge: 'OB', type: 'door-open-bottom', wmm: 800, hmm: 2100 },
    ],
  },
  {
    group: 'Ventilation',
    presets: [
      { id: 'ventilator', label: 'Brick Ventilator', badge: 'BV', type: 'ventilator', wmm: 600, hmm: 450 },
      { id: 'exhaust-fan', label: 'Exhaust Fan', badge: 'EF', type: 'exhaust-fan', wmm: 300, hmm: 300 },
      { id: 'exhaust-fan-rect', label: 'Rectangle Exhaust', badge: 'RE', type: 'exhaust-fan-rect', wmm: 300, hmm: 300 },
      { id: 'ac-sleeve', label: 'AC Sleeve', badge: 'AS', type: 'ac-sleeve', wmm: 800, hmm: 400 },
      { id: 'window-ac', label: 'Window AC', badge: 'AC', type: 'window-ac', wmm: 660, hmm: 430 },
    ],
  },
  {
    group: 'Special Elements',
    presets: [
      { id: 'glass-block', label: 'Glass Block Wall', badge: 'GB', type: 'glass-block', wmm: 900, hmm: 1200 },
      { id: 'georgian-bars', label: 'Georgian Bars', badge: 'GG', type: 'georgian-bars', wmm: 900, hmm: 1200 },
      { id: 'roller-shutter', label: 'Roller Shutter', badge: 'RS', type: 'roller-shutter', wmm: 1200, hmm: 1500 },
      { id: 'skylight', label: 'Skylight', badge: 'SK', type: 'skylight', wmm: 1000, hmm: 1000 },
      { id: 'grille', label: 'Iron Grille', badge: 'IG', type: 'grille', wmm: 900, hmm: 1200 },
      { id: 'rectangle', label: 'Rectangle Frame', badge: 'R3', type: 'rectangle', wmm: 500, hmm: 1000 },
      { id: 'custom-image', label: 'Custom Image', badge: 'IMG', type: 'custom-image', wmm: 900, hmm: 1200 },
    ],
  },
  {
    group: 'Screens',
    presets: [
      { id: 'mesh-screen', label: 'Mesh Screen', badge: 'MS', type: 'mesh-screen', wmm: 900, hmm: 1200 },
      { id: 'mosquito-mesh', label: 'Mosquito Mesh', badge: 'MS', type: 'mesh-screen', props: { meshSize: 'fine' }, wmm: 900, hmm: 1200 },
      { id: 'fly-screen', label: 'Fly Screen', badge: 'FS', type: 'fly-screen', wmm: 900, hmm: 1200 },
      { id: 'roller-blind', label: 'Roller Blind', badge: 'RB', type: 'roller-blind', wmm: 900, hmm: 1500 },
      { id: 'frosted-film', label: 'Frosted Film', badge: 'FF', type: 'frosted-film', wmm: 900, hmm: 1200 },
    ],
  },
]

/** Flat preset lookup by id. */
export const WINDOW_PRESET_MAP: Record<string, WindowPreset> = Object.fromEntries(
  WINDOW_PRESET_GROUPS.flatMap((g) => g.presets).map((p) => [p.id, p])
)

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
  /** Special band produced by a frame shape (e.g. the arched top of an arc). */
  band?: 'arc'
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
  /** Optional profile material + series (metadata; does not change pricing). */
  material?: 'aluminium' | 'upvc'
  series?: string
}

/**
 * Non-rectangular frame outline. `rect` is the default. Others reshape the
 * outer frame (and carve/trim sections) like the reference editor:
 *  - angular : an L-shape with one corner cut out
 *  - arc     : an arched (semi-elliptical) top band
 *  - u-shape : a bay with raised left/right wings
 */
export type FrameShape =
  | { kind: 'rect' }
  | { kind: 'angular'; corner: 'tl' | 'tr' | 'bl' | 'br'; cutW: number; cutH: number }
  | { kind: 'arc'; rise: number }
  | { kind: 'u-shape'; leftW: number; rightW: number; wingDrop: number }

export interface FrameDocument {
  id: string | null
  /** Schema marker so we can distinguish from the legacy shape model. */
  kind: 'frame'
  /** Overall opening size in mm. */
  width: number
  height: number
  /** Outer frame outline. Defaults to a plain rectangle. */
  shape?: FrameShape
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
  type: WindowTypeId,
  overrideProps?: Record<string, unknown>
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
  const props = { ...WINDOW_TYPE_MAP[type].defaults(), ...(overrideProps ?? {}) }
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
  let fracs = Array.isArray(props.panelFractions)
    ? [...(props.panelFractions as number[])]
    : []

  for (let i = 0; i < panels; i++) {
    if (dirs[i] == null) dirs[i] = i % 2 === 0 ? 'right' : 'left'
    if (handles[i] == null) handles[i] = i % 2 === 0 ? 'right' : 'left'
    if (acc[i] == null) acc[i] = {}
  }
  dirs.length = panels
  handles.length = panels
  acc.length = panels

  // Fractions: default to equal; renormalise to the panel count and sum=1.
  if (fracs.length !== panels || fracs.some((f) => !Number.isFinite(f) || f <= 0)) {
    fracs = Array(panels).fill(1 / panels)
  } else {
    const total = fracs.reduce((a, b) => a + b, 0)
    fracs = total > 0 ? fracs.map((f) => f / total) : Array(panels).fill(1 / panels)
  }

  props.panelDirs = dirs
  props.panelHandles = handles
  props.panelAccessories = acc
  props.panelFractions = fracs
  return props
}

/**
 * Set one sliding panel's width (mm) within a section of total width
 * `sectionWidthMm`, keeping the sum constant by absorbing the delta from the
 * other panels proportionally. Returns new fraction array.
 */
export function setPanelWidthMm(
  fractions: number[],
  panelIdx: number,
  newWidthMm: number,
  sectionWidthMm: number,
  minMm = 100
): number[] {
  const n = fractions.length
  if (n <= 1 || sectionWidthMm <= 0) return fractions
  const clampedNew = Math.max(minMm, Math.min(sectionWidthMm - minMm * (n - 1), newWidthMm))
  const newFrac = clampedNew / sectionWidthMm
  const othersOld = fractions.reduce((sum, f, i) => (i === panelIdx ? sum : sum + f), 0)
  const remaining = 1 - newFrac
  const out = fractions.map((f, i) => {
    if (i === panelIdx) return newFrac
    return othersOld > 0 ? (f / othersOld) * remaining : remaining / (n - 1)
  })
  return out
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

/**
 * Move a divider along its axis to a new centre position (mm) and resize the
 * two sections immediately adjacent to it. Clamped so neither side drops below
 * MIN_SECTION_MM. Only handles the two sections sharing the divider edge.
 */
export function moveDivider(
  doc: FrameDocument,
  dividerId: number,
  newCenterMm: number
): FrameDocument {
  const next = cloneDoc(doc)
  const d = next.dividers.find((x) => x.id === dividerId)
  if (!d) return next

  const half = d.cw / 2 // for 'v'; for 'h' use ch/2 below
  if (d.orient === 'v') {
    const edge = d.cx + d.cw / 2 // current centre x
    // Section ending at the divider's left, and section starting at its right.
    const left = next.sections.find(
      (s) => Math.abs(s.sx + s.sw - (d.cx)) < 2 && overlapY(s, d)
    )
    const right = next.sections.find(
      (s) => Math.abs(s.sx - (d.cx + d.cw)) < 2 && overlapY(s, d)
    )
    if (!left || !right) return next
    const minX = left.sx + MIN_SECTION_MM + d.cw / 2
    const maxX = right.sx + right.sw - MIN_SECTION_MM - d.cw / 2
    const cx = Math.max(minX, Math.min(maxX, newCenterMm))
    const dx = cx - edge
    left.sw += dx
    right.sx += dx
    right.sw -= dx
    d.cx += dx
  } else {
    const edge = d.cy + d.ch / 2
    const top = next.sections.find(
      (s) => Math.abs(s.sy + s.sh - d.cy) < 2 && overlapX(s, d)
    )
    const bottom = next.sections.find(
      (s) => Math.abs(s.sy - (d.cy + d.ch)) < 2 && overlapX(s, d)
    )
    if (!top || !bottom) return next
    const minY = top.sy + MIN_SECTION_MM + d.ch / 2
    const maxY = bottom.sy + bottom.sh - MIN_SECTION_MM - d.ch / 2
    const cy = Math.max(minY, Math.min(maxY, newCenterMm))
    const dy = cy - edge
    top.sh += dy
    bottom.sy += dy
    bottom.sh -= dy
    d.cy += dy
  }
  void half
  return next
}

function overlapY(s: FrameSection, d: Divider): boolean {
  return s.sy < d.cy + d.ch && s.sy + s.sh > d.cy
}
function overlapX(s: FrameSection, d: Divider): boolean {
  return s.sx < d.cx + d.cw && s.sx + s.sw > d.cx
}

/* ------------------------------------------------------------------ *
 * Frame shapes (non-rectangular outlines)
 * ------------------------------------------------------------------ */

/** Default parameters for a shape at a given frame size. */
export function defaultShapeParams(
  kind: FrameShape['kind'],
  width: number,
  height: number
): FrameShape {
  switch (kind) {
    case 'angular':
      return { kind: 'angular', corner: 'tr', cutW: Math.round(width * 0.42), cutH: Math.round(height * 0.42) }
    case 'arc':
      return { kind: 'arc', rise: Math.round(Math.min(width / 2, height * 0.4)) }
    case 'u-shape':
      return {
        kind: 'u-shape',
        leftW: Math.round(width * 0.28),
        rightW: Math.round(width * 0.28),
        wingDrop: Math.round(height * 0.3),
      }
    default:
      return { kind: 'rect' }
  }
}

/**
 * Apply a frame shape, rebuilding the section layout to fit it. This resets to
 * a clean section set appropriate for the shape (like the reference, which
 * rebuilds sections when a shape coupler is applied).
 *
 *  - rect     : single full-size section
 *  - arc      : an arched top band section + a rectangular body section
 *  - angular  : L-shape — body section plus the non-cut leg; the cut corner
 *               is left empty (no section)
 *  - u-shape  : three sections (left wing, center, right wing)
 */
export function applyFrameShape(doc: FrameDocument, shape: FrameShape): FrameDocument {
  const next = cloneDoc(doc)
  next.shape = shape
  const W = next.width
  const H = next.height

  if (shape.kind === 'rect') {
    next.sections = [{ id: nextId(), idx: 1, sx: 0, sy: 0, sw: W, sh: H, window: null }]
  } else if (shape.kind === 'arc') {
    const rise = Math.max(40, Math.min(shape.rise, H - MIN_SECTION_MM))
    next.sections = [
      { id: nextId(), idx: 1, sx: 0, sy: 0, sw: W, sh: rise, window: null, band: 'arc' },
      { id: nextId(), idx: 2, sx: 0, sy: rise, sw: W, sh: H - rise, window: null },
    ]
  } else if (shape.kind === 'u-shape') {
    const leftW = Math.max(MIN_SECTION_MM, Math.min(shape.leftW, W * 0.4))
    const rightW = Math.max(MIN_SECTION_MM, Math.min(shape.rightW, W * 0.4))
    const centerW = W - leftW - rightW
    const drop = Math.max(0, Math.min(shape.wingDrop, H - MIN_SECTION_MM))
    next.sections = [
      { id: nextId(), idx: 1, sx: 0, sy: 0, sw: leftW, sh: H, window: null },
      { id: nextId(), idx: 2, sx: leftW, sy: drop, sw: centerW, sh: H - drop, window: null },
      { id: nextId(), idx: 3, sx: leftW + centerW, sy: 0, sw: rightW, sh: H, window: null },
    ]
  } else {
    // angular — one corner removed; keep an L of two rectangles.
    const cutW = Math.max(MIN_SECTION_MM, Math.min(shape.cutW, W - MIN_SECTION_MM))
    const cutH = Math.max(MIN_SECTION_MM, Math.min(shape.cutH, H - MIN_SECTION_MM))
    const bodyH = H - cutH
    // Bottom full-width band + a top leg on the side opposite the cut.
    const legOnLeft = shape.corner === 'tr' || shape.corner === 'br'
    const topY = shape.corner === 'bl' || shape.corner === 'br' ? cutH : 0
    const bottomY = shape.corner === 'bl' || shape.corner === 'br' ? 0 : cutH
    const legX = legOnLeft ? 0 : W - (W - cutW)
    next.sections = [
      // Full-width band (the part with no cut).
      { id: nextId(), idx: 1, sx: 0, sy: bottomY, sw: W, sh: bodyH, window: null },
      // The leg beside the cut corner.
      { id: nextId(), idx: 2, sx: legX, sy: topY, sw: W - cutW, sh: cutH, window: null },
    ]
  }
  renumber(next)
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
