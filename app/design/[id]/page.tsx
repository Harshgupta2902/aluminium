import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EditorShell } from '@/components/design-editor/editor-shell'
import {
  type DesignDocument,
  emptyDetails,
  findTemplate,
  shapeFromTemplate,
} from '@/lib/design-editor/model'

export default async function DesignEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ quotationId?: string; template?: string }>
}) {
  // Request-time route (session + per-request data); not prerendered.
  await connection()

  const { id } = await params
  const { quotationId, template: templateKey } = await searchParams
  const supabase = await createClient()

  const initialDocument = await buildInitialDocument(supabase, {
    id,
    quotationId,
    templateKey,
  })

  return <EditorShell initialDocument={initialDocument} />
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function buildInitialDocument(
  supabase: SupabaseClient,
  opts: { id: string; quotationId?: string; templateKey?: string }
): Promise<DesignDocument> {
  const { id, quotationId, templateKey } = opts

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

  // 3) Fresh document, optionally pre-seeded with a template from the URL.
  const details = emptyDetails()
  const shapes = []
  if (templateKey) {
    const template = findTemplate(templateKey)
    if (template) shapes.push(shapeFromTemplate(template, 1))
  }
  return { id: null, details, shapes }
}
