'use client'

import { create } from 'zustand'
import {
  type FrameDocument,
  type FrameDetails,
  type WindowTypeId,
  clearSection,
  createFrameDocument,
  placeWindow,
  resizeFrame,
  splitSection,
  syncCounter,
  updateFrameDetails,
  updateWindowProps,
} from '@/lib/design-editor/frame-model'

interface FrameEditorState {
  doc: FrameDocument
  selectedSectionId: number | null
  zoom: number
  /** Transient status/toast message for drop feedback. */
  message: { text: string; kind: 'ok' | 'err' } | null

  past: FrameDocument[]
  future: FrameDocument[]

  load: (doc: FrameDocument) => void
  selectSection: (id: number | null) => void
  setZoom: (z: number) => void
  fitZoom: () => void
  flash: (text: string, kind: 'ok' | 'err') => void

  dropWindow: (sectionId: number, type: WindowTypeId) => void
  dropDivider: (orient: 'v' | 'h', x: number, y: number, kind: 'coupler' | 'mullion') => void
  clearSelectedWindow: () => void
  patchWindow: (sectionId: number, patch: Record<string, unknown>) => void
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
  zoom: 1,
  message: null,
  past: [],
  future: [],

  load: (doc) => {
    syncCounter(doc)
    set({
      doc,
      selectedSectionId: doc.sections[0]?.id ?? null,
      zoom: 1,
      past: [],
      future: [],
      message: null,
    })
  },

  selectSection: (id) => set({ selectedSectionId: id }),
  setZoom: (z) => set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) }),
  fitZoom: () => set({ zoom: 1 }),
  flash: (text, kind) => {
    set({ message: { text, kind } })
    setTimeout(() => {
      if (get().message?.text === text) set({ message: null })
    }, 2200)
  },

  dropWindow: (sectionId, type) =>
    set((state) => {
      const res = placeWindow(state.doc, sectionId, type)
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
