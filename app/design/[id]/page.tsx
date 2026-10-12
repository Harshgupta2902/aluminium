import { createClient } from '@/lib/supabase/server'
import { EditorShell } from '@/components/design-editor/editor-shell'
import {
  type DesignDocument,
  defaultTemplateForType,
  emptyDetails,
  findTemplate,
  shapeFromTemplate,
} from '@/lib/design-editor/model'

export default async function DesignEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    quotationId?: string
    template?: string
    windowType?: string
    width?: string
    height?: string
  }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const initialDocument = await buildInitialDocument(supabase, {
    id,
    quotationId: sp.quotationId,
    templateKey: sp.template,
    windowType: sp.windowType,
    width: sp.width ? Number(sp.width) : undefined,
    height: sp.height ? Number(sp.height) : undefined,
  })

  return <EditorShell initialDocument={initialDocument} />
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function buildInitialDocument(
  supabase: SupabaseClient,
  opts: {
    id: string
    quotationId?: string
    templateKey?: string
    windowType?: string
    width?: number
    height?: number
  }
): Promise<DesignDocument> {
  const { id, quotationId, templateKey, windowType, width, height } = opts

  // 1) Editing an existing saved design: load its editor document if present.
  if (id && id !== 'new') {
    const { data } = await supabase
      .from('window_designs')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      if (data.editor_document) {
        const doc = data.editor_document as DesignDocument
        return { ...doc, id: data.id }
      }
      // Legacy design without an editor document: synthesize one.
      const details = emptyDetails()
      details.designName = data.name ?? ''
      details.colour = data.color ?? details.colour
      details.glassType = data.glass_type ?? ''
      const template =
        findTemplate(`${data.window_type}-1`) ??
        findTemplate('sliding-2t')!
      const shape = shapeFromTemplate(template, 1)
      shape.width = Number(data.width) || shape.width
      shape.height = Number(data.height) || shape.height
      return { id: data.id, details, shapes: [shape] }
    }
  }

  // 2) Seeded from a quotation's first item.
  if (quotationId) {
    const { data: quotation } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single()

    if (quotation?.items?.length) {
      const item = quotation.items[0]
      const details = emptyDetails()
      details.designName = `${quotation.client_name} - Window`
      details.colour = item.color ?? details.colour
      details.glassType = item.glass_type ?? ''
      const template =
        findTemplate(`${item.window_type}-1`) ?? findTemplate('sliding-2t')!
      const shape = shapeFromTemplate(template, 1)
      shape.width = item.dimensions?.width ?? shape.width
      shape.height = item.dimensions?.height ?? shape.height
      return { id: null, details, shapes: [shape] }
    }
  }

  // 3) Fresh document, optionally pre-seeded from the URL.
  //    - ?template=<editor-key> picks an exact editor template
  //    - ?windowType=<type>&width=&height= seeds from a DB template card
  const details = emptyDetails()
  const shapes = []

  const seedTemplate = templateKey
    ? findTemplate(templateKey)
    : windowType
      ? defaultTemplateForType(windowType)
      : undefined

  if (seedTemplate) {
    const shape = shapeFromTemplate(seedTemplate, 1)
    if (width && width > 0) shape.width = width
    if (height && height > 0) shape.height = height
    shapes.push(shape)
  }

  return { id: null, details, shapes }
}
