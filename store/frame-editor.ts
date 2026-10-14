'use client'

import { create } from 'zustand'
import {
  type FrameDocument,
  type FrameDetails,
  type WindowTypeId,
  type PanelDir,
  type PanelAccessory,
  type FrameShape,
  applyFrameShape,
  clearSection,
  createFrameDocument,
  defaultShapeParams,
  moveDivider,
  normalizeDocumentPanels,
  normalizeSlidingPanels,
  placeWindow,
  resizeFrame,
  setPanelWidthMm,
  splitSection,
  syncCounter,
  updateFrameDetails,
  updateWindowProps,
} from '@/lib/design-editor/frame-model'

export interface SavedPanel {
  /** Label like "S1" at the time it was saved. */
  sectionLabel: string
  widthMm: number
  heightMm: number
  /** Sash accessory name, if chosen. */
  sash: string
  /** Full per-panel accessory snapshot to reuse. */
  accessories: Partial<Record<string, PanelAccessory>>
  dir: PanelDir
  handle: 'left' | 'right'
}

interface FrameEditorState {
  doc: FrameDocument
  selectedSectionId: number | null
  /** Index of the selected panel within the selected sliding section. */
  selectedPanelIdx: number | null
  savedPanels: SavedPanel[]
  zoom: number
  /** Transient status/toast message for drop feedback. */
  message: { text: string; kind: 'ok' | 'err' } | null

  past: FrameDocument[]
  future: FrameDocument[]

  load: (doc: FrameDocument) => void
  selectSection: (id: number | null) => void
  selectPanel: (idx: number | null) => void
  setZoom: (z: number) => void
  fitZoom: () => void
  flash: (text: string, kind: 'ok' | 'err') => void

  dropWindow: (sectionId: number, type: WindowTypeId, overrideProps?: Record<string, unknown>) => void
  dropDivider: (orient: 'v' | 'h', x: number, y: number, kind: 'coupler' | 'mullion') => void
  clearSelectedWindow: () => void
  patchWindow: (sectionId: number, patch: Record<string, unknown>) => void

  /* Geometry editing. */
  setPanelWidth: (sectionId: number, panelIdx: number, widthMm: number) => void
  moveDividerTo: (dividerId: number, centerMm: number) => void
  setFrameShape: (kind: FrameShape['kind']) => void

  /* Per-panel (sliding) editing. */
  setPanelDir: (sectionId: number, panelIdx: number, dir: PanelDir) => void
  setPanelHandle: (sectionId: number, panelIdx: number, pos: 'left' | 'right') => void
  patchPanelAccessory: (
    sectionId: number,
    panelIdx: number,
    kind: string,
    value: PanelAccessory | null
  ) => void
  saveCurrentPanel: () => void
  applySavedPanel: (saved: SavedPanel) => void
  removeSavedPanel: (index: number) => void
  patchDetails: (patch: Partial<FrameDetails>) => void
  setFrameSize: (w: number, h: number) => void
  clearAll: () => void

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

export const MIN_ZOOM = 0.3
export const MAX_ZOOM = 2.5

export const useFrameStore = create<FrameEditorState>((set, get) => ({
  doc: createFrameDocument(),
  selectedSectionId: null,
  selectedPanelIdx: null,
  savedPanels: [],
  zoom: 1,
  message: null,
  past: [],
  future: [],

  load: (doc) => {
    syncCounter(doc)
    normalizeDocumentPanels(doc)
    set({
      doc,
      selectedSectionId: doc.sections[0]?.id ?? null,
      selectedPanelIdx: null,
      savedPanels: [],
      zoom: 1,
      past: [],
      future: [],
      message: null,
    })
  },

  selectSection: (id) => set({ selectedSectionId: id, selectedPanelIdx: null }),
  selectPanel: (idx) => set({ selectedPanelIdx: idx }),
  setZoom: (z) => set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) }),
  fitZoom: () => set({ zoom: 1 }),
  flash: (text, kind) => {
    set({ message: { text, kind } })
    setTimeout(() => {
      if (get().message?.text === text) set({ message: null })
    }, 2200)
  },

  dropWindow: (sectionId, type, overrideProps) =>
    set((state) => {
      const res = placeWindow(state.doc, sectionId, type, overrideProps)
      get().flash(res.msg, res.ok ? 'ok' : 'err')
      if (!res.ok || !res.doc) return state
      return {
        past: [...state.past, state.doc],
        future: [],
        doc: res.doc,
        selectedSectionId: sectionId,
      }
    }),

  dropDivider: (orient, x, y, kind) =>
    set((state) => {
      const res = splitSection(state.doc, orient, x, y, kind)
      get().flash(res.msg, res.ok ? 'ok' : 'err')
      if (!res.ok || !res.doc) return state
      return { past: [...state.past, state.doc], future: [], doc: res.doc }
    }),

  clearSelectedWindow: () =>
    set((state) => {
      if (state.selectedSectionId == null) return state
      return {
        past: [...state.past, state.doc],
        future: [],
        doc: clearSection(state.doc, state.selectedSectionId),
      }
    }),

  patchWindow: (sectionId, patch) =>
    set((state) => ({
      past: [...state.past, state.doc],
      future: [],
      doc: updateWindowProps(state.doc, sectionId, patch),
    })),

  setPanelWidth: (sectionId, panelIdx, widthMm) =>
    set((state) => {
      const sec = state.doc.sections.find((s) => s.id === sectionId)
      if (!sec?.window || sec.window.type !== 'sliding') return state
      const props = { ...sec.window.props }
      normalizeSlidingPanels(props)
      const fracs = props.panelFractions as number[]
      const next = setPanelWidthMm(fracs, panelIdx, widthMm, sec.sw)
      return {
        past: [...state.past, state.doc],
        future: [],
        doc: updateWindowProps(state.doc, sectionId, { panelFractions: next }),
      }
    }),

  moveDividerTo: (dividerId, centerMm) =>
    set((state) => ({
      past: [...state.past, state.doc],
      future: [],
      doc: moveDivider(state.doc, dividerId, centerMm),
    })),

  setFrameShape: (kind) =>
    set((state) => {
      const shape = defaultShapeParams(kind, state.doc.width, state.doc.height)
      const doc = applyFrameShape(state.doc, shape)
      return {
        past: [...state.past, state.doc],
        future: [],
        doc,
        selectedSectionId: doc.sections[0]?.id ?? null,
        selectedPanelIdx: null,
      }
    }),

  setPanelDir: (sectionId, panelIdx, dir) =>
    set((state) => {
      const win = state.doc.sections.find((s) => s.id === sectionId)?.window
      if (!win || win.type !== 'sliding') return state
      const props = { ...win.props }
      normalizeSlidingPanels(props)
      const dirs = [...(props.panelDirs as PanelDir[])]
      dirs[panelIdx] = dir
      props.panelDirs = dirs
      return {
        past: [...state.past, state.doc],
        future: [],
        doc: updateWindowProps(state.doc, sectionId, {
          panelDirs: dirs,
          panelHandles: props.panelHandles,
          panelAccessories: props.panelAccessories,
        }),
      }
    }),

  setPanelHandle: (sectionId, panelIdx, pos) =>
    set((state) => {
      const win = state.doc.sections.find((s) => s.id === sectionId)?.window
      if (!win || win.type !== 'sliding') return state
      const props = { ...win.props }
      normalizeSlidingPanels(props)
      const handles = [...(props.panelHandles as ('left' | 'right')[])]
      handles[panelIdx] = pos
      return {
        past: [...state.past, state.doc],
        future: [],
        doc: updateWindowProps(state.doc, sectionId, { panelHandles: handles }),
      }
    }),

  patchPanelAccessory: (sectionId, panelIdx, kind, value) =>
    set((state) => {
      const win = state.doc.sections.find((s) => s.id === sectionId)?.window
      if (!win || win.type !== 'sliding') return state
      const props = { ...win.props }
      normalizeSlidingPanels(props)
      const acc = (props.panelAccessories as Partial<Record<string, PanelAccessory>>[]).map(
        (a) => ({ ...a })
      )
      const entry = { ...(acc[panelIdx] ?? {}) }
      if (value) entry[kind] = value
      else delete entry[kind]
      acc[panelIdx] = entry
      return {
        past: [...state.past, state.doc],
        future: [],
        doc: updateWindowProps(state.doc, sectionId, { panelAccessories: acc }),
      }
    }),

  saveCurrentPanel: () =>
    set((state) => {
      const sec = state.doc.sections.find((s) => s.id === state.selectedSectionId)
      const idx = state.selectedPanelIdx
      if (!sec?.window || sec.window.type !== 'sliding' || idx == null) return state
      const props = { ...sec.window.props }
      normalizeSlidingPanels(props)
      const panels = Math.max(1, Number(props.panels) || 2)
      const dirs = props.panelDirs as PanelDir[]
      const handles = props.panelHandles as ('left' | 'right')[]
      const acc = props.panelAccessories as Partial<Record<string, PanelAccessory>>[]
      const label = `S${sec.idx}.${idx + 1}`
      const widthMm = Math.round(sec.sw / panels)
      const entry: SavedPanel = {
        sectionLabel: label,
        widthMm,
        heightMm: Math.round(sec.sh),
        sash: acc[idx]?.sash?.name ?? '',
        accessories: { ...(acc[idx] ?? {}) },
        dir: dirs[idx] ?? 'right',
        handle: handles[idx] ?? 'right',
      }
      // De-dup by label (replace an existing snapshot for the same panel).
      const rest = state.savedPanels.filter((p) => p.sectionLabel !== label)
      get().flash('Panel saved', 'ok')
      return { savedPanels: [...rest, entry] }
    }),

  applySavedPanel: (saved) =>
    set((state) => {
      const sec = state.doc.sections.find((s) => s.id === state.selectedSectionId)
      const idx = state.selectedPanelIdx
      if (!sec?.window || sec.window.type !== 'sliding' || idx == null) return state
      const props = { ...sec.window.props }
      normalizeSlidingPanels(props)
      const dirs = [...(props.panelDirs as PanelDir[])]
      const handles = [...(props.panelHandles as ('left' | 'right')[])]
      const acc = (props.panelAccessories as Partial<Record<string, PanelAccessory>>[]).map(
        (a) => ({ ...a })
      )
      dirs[idx] = saved.dir
      handles[idx] = saved.handle
      acc[idx] = { ...saved.accessories }
      get().flash('Saved panel applied', 'ok')
      return {
        past: [...state.past, state.doc],
        future: [],
        doc: updateWindowProps(state.doc, sec.id, {
          panelDirs: dirs,
          panelHandles: handles,
          panelAccessories: acc,
        }),
      }
    }),

  removeSavedPanel: (index) =>
    set((state) => ({
      savedPanels: state.savedPanels.filter((_, i) => i !== index),
    })),

  patchDetails: (patch) =>
    set((state) => ({
      past: [...state.past, state.doc],
      future: [],
      doc: updateFrameDetails(state.doc, patch),
    })),

  setFrameSize: (w, h) =>
    set((state) => ({
      past: [...state.past, state.doc],
      future: [],
      doc: resizeFrame(state.doc, w, h),
    })),

  clearAll: () =>
    set((state) => {
      const fresh = createFrameDocument(state.doc.width, state.doc.height)
      fresh.id = state.doc.id
      fresh.details = { ...state.doc.details }
      return {
        past: [...state.past, state.doc],
        future: [],
        doc: fresh,
        selectedSectionId: fresh.sections[0]?.id ?? null,
      }
    }),

  undo: () =>
    set((state) => {
      const prev = state.past[state.past.length - 1]
      if (!prev) return state
      return {
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future],
        doc: prev,
        selectedSectionId:
          prev.sections.find((s) => s.id === state.selectedSectionId)?.id ?? null,
      }
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0]
      if (!next) return state
      return {
        past: [...state.past, state.doc],
        future: state.future.slice(1),
        doc: next,
      }
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}))
