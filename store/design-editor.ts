'use client'

import { create } from 'zustand'
import {
  type DesignDetails,
  type DesignDocument,
  type WindowShape,
  type WindowTemplate,
  emptyDetails,
  shapeFromTemplate,
} from '@/lib/design-editor/model'

/** A snapshot of the editable document used for undo/redo. */
interface Snapshot {
  shapes: WindowShape[]
  details: DesignDetails
}

interface EditorState {
  /** Supabase id of the design/quotation being edited, or null for new. */
  documentId: string | null
  shapes: WindowShape[]
  details: DesignDetails
  selectedId: string | null
  /** Zoom as a fraction, 1 = 100%. */
  zoom: number

  // Undo/redo stacks (snapshots of shapes + details).
  past: Snapshot[]
  future: Snapshot[]

  // --- lifecycle ---
  load: (doc: DesignDocument) => void
  reset: () => void

  // --- shape CRUD ---
  addTemplate: (template: WindowTemplate) => void
  updateShape: (id: string, patch: Partial<WindowShape>) => void
  deleteSelected: () => void
  clearAll: () => void
  selectShape: (id: string | null) => void

  // --- details ---
  updateDetails: (patch: Partial<DesignDetails>) => void

  // --- view ---
  setZoom: (zoom: number) => void

  // --- history ---
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // --- serialization ---
  toDocument: () => DesignDocument
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3

function snapshot(state: EditorState): Snapshot {
  return {
    shapes: state.shapes.map((s) => ({ ...s })),
    details: { ...state.details },
  }
}

function nextIndex(shapes: WindowShape[]): number {
  return shapes.reduce((max, s) => Math.max(max, s.index), 0) + 1
}

export const useEditorStore = create<EditorState>((set, get) => ({
  documentId: null,
  shapes: [],
  details: emptyDetails(),
  selectedId: null,
  zoom: 1,
  past: [],
  future: [],

  load: (doc) =>
    set({
      documentId: doc.id,
      shapes: doc.shapes.map((s) => ({ ...s })),
      details: { ...doc.details },
      selectedId: doc.shapes[0]?.id ?? null,
      zoom: 1,
      past: [],
      future: [],
    }),

  reset: () =>
    set({
      documentId: null,
      shapes: [],
      details: emptyDetails(),
      selectedId: null,
      zoom: 1,
      past: [],
      future: [],
    }),

  addTemplate: (template) =>
    set((state) => {
      const index = nextIndex(state.shapes)
      // Place new shapes slightly offset so they don't fully overlap.
      const offset = (state.shapes.length % 5) * 120
      const shape = shapeFromTemplate(template, index, {
        x: offset,
        y: offset,
      })
      return {
        past: [...state.past, snapshot(state)],
        future: [],
        shapes: [...state.shapes, shape],
        selectedId: shape.id,
      }
    }),

  updateShape: (id, patch) =>
    set((state) => ({
      past: [...state.past, snapshot(state)],
      future: [],
      shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  deleteSelected: () =>
    set((state) => {
      if (!state.selectedId) return state
      return {
        past: [...state.past, snapshot(state)],
        future: [],
        shapes: state.shapes.filter((s) => s.id !== state.selectedId),
        selectedId: null,
      }
    }),

  clearAll: () =>
    set((state) => {
      if (state.shapes.length === 0) return state
      return {
        past: [...state.past, snapshot(state)],
        future: [],
        shapes: [],
        selectedId: null,
      }
    }),

  selectShape: (id) => set({ selectedId: id }),

  updateDetails: (patch) =>
    set((state) => ({
      past: [...state.past, snapshot(state)],
      future: [],
      details: { ...state.details, ...patch },
    })),

  setZoom: (zoom) =>
    set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) }),

  undo: () =>
    set((state) => {
      const prev = state.past[state.past.length - 1]
      if (!prev) return state
      return {
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future],
        shapes: prev.shapes.map((s) => ({ ...s })),
        details: { ...prev.details },
        selectedId:
          prev.shapes.find((s) => s.id === state.selectedId)?.id ?? null,
      }
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0]
      if (!next) return state
      return {
        past: [...state.past, snapshot(state)],
        future: state.future.slice(1),
        shapes: next.shapes.map((s) => ({ ...s })),
        details: { ...next.details },
        selectedId:
          next.shapes.find((s) => s.id === state.selectedId)?.id ?? null,
      }
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  toDocument: () => {
    const { documentId, shapes, details } = get()
    return {
      id: documentId,
      shapes: shapes.map((s) => ({ ...s })),
      details: { ...details },
    }
  },
}))
