import { createClient } from '@/lib/supabase/server'
import { FrameEditorShell } from '@/components/design-editor/frame-editor-shell'
import {
  type FrameDocument,
  type WindowTypeId,
  createFrameDocument,
  emptyFrameDetails,
  isFrameDocument,
  WINDOW_TYPE_MAP,
} from '@/lib/design-editor/frame-model'

export default async function DesignEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    quotationId?: string
    windowType?: string
    width?: string
    height?: string
  }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const initialDocument = await buildInitialFrame(supabase, {
    id,
    quotationId: sp.quotationId,
    windowType: sp.windowType,
    width: sp.width ? Number(sp.width) : undefined,
    height: sp.height ? Number(sp.height) : undefined,
  })

  return (
    <FrameEditorShell
      initialDocument={initialDocument}
      quotationId={sp.quotationId ?? null}
    />
  )
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function buildInitialFrame(
  supabase: SupabaseClient,
  opts: {
    id: string
    quotationId?: string
    windowType?: string
    width?: number
    height?: number
  }
): Promise<FrameDocument> {
  const { id, quotationId, windowType, width, height } = opts

  // 1) Existing saved design.
  if (id && id !== 'new') {
    const { data } = await supabase
      .from('window_designs')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      const stored = data.editor_document
      if (isFrameDocument(stored)) {
        return { ...stored, id: data.id }
      }
      // Legacy document (old shape model) or none: migrate from DB columns.
      return migrateLegacy(data)
    }
  }

  // 2) Fresh frame, optionally seeded from a quotation and/or URL hints.
  const doc = createFrameDocument(
    width && width > 0 ? width : undefined,
    height && height > 0 ? height : undefined
  )

  if (quotationId) {
    const { data: quotation } = await supabase
      .from('quotations')
      .select('client_name')
      .eq('id', quotationId)
      .single()
    if (quotation?.client_name) {
      doc.details.designName = `${quotation.client_name} - Window`
    }
  }

  // Pre-place a window type if the URL hints one.
  const seedType = normalizeType(windowType)
  if (seedType && doc.sections[0]) {
    doc.sections[0].window = {
      type: seedType,
      props: WINDOW_TYPE_MAP[seedType].defaults(),
    }
  }

  return doc
}

/** Build a frame from the legacy single-window columns / old shape document. */
function migrateLegacy(data: Record<string, unknown>): FrameDocument {
  const w = Number(data.width) || 1500
  const h = Number(data.height) || 1200
  const doc = createFrameDocument(w, h)
  doc.id = (data.id as string) ?? null
  doc.details = {
    ...emptyFrameDetails(),
    designName: (data.name as string) ?? '',
    colour: (data.color as string) ?? 'White',
    glassType: (data.glass_type as string) ?? '',
    ratePerSqft:
      typeof data.rate_per_sqft === 'number' && data.rate_per_sqft > 0
        ? (data.rate_per_sqft as number)
        : null,
  }
  const type = normalizeType(data.window_type as string) ?? 'sliding'
  if (doc.sections[0]) {
    doc.sections[0].window = { type, props: WINDOW_TYPE_MAP[type].defaults() }
  }
  return doc
}

/** Map a loose window_type string to a known type id. */
function normalizeType(raw: string | null | undefined): WindowTypeId | null {
  if (!raw) return null
  const v = raw.toLowerCase()
  if (WINDOW_TYPE_MAP[v]) return v as WindowTypeId
  if (v.includes('slid')) return 'sliding'
  if (v.includes('casement')) return 'casement'
  if (v.includes('door')) return 'door-single'
  if (v.includes('fix')) return 'fixed'
  if (v.includes('louver')) return 'louvered'
  if (v.includes('vent')) return 'ventilator'
  return null
}
