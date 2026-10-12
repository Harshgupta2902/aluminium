'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'
import { useEditorStore } from '@/store/design-editor'
import { type DesignDocument } from '@/lib/design-editor/model'
import { EditorToolbar } from './toolbar'
import { ToolSidebar } from './tool-sidebar'
import { DetailsPanel } from './details-panel'
import { DesignCanvas } from './canvas'

export function EditorShell({
  initialDocument,
}: {
  initialDocument: DesignDocument
}) {
  const router = useRouter()
  const supabase = createClient()

  const load = useEditorStore((s) => s.load)
  const toDocument = useEditorStore((s) => s.toDocument)
  const shapes = useEditorStore((s) => s.shapes)

  const [detailsOpen, setDetailsOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hydrate the store once from the server-provided document.
  useEffect(() => {
    load(initialDocument)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to save.')
        return
      }

      const doc = toDocument()
      const first = doc.shapes[0]
      if (!first) {
        setError('Add at least one window before saving.')
        return
      }

      // Derive the legacy NOT NULL columns from the first shape + details.
      const row = {
        name: doc.details.designName || doc.details.designRef || 'Untitled',
        window_type: first.type,
        width: first.width,
        height: first.height,
        profile_type: 'aluminium',
        glass_type: doc.details.glassType || 'clear',
        glass_thickness: 5,
        color: doc.details.colour,
        editor_document: doc,
        created_by: user.id,
      }

      if (doc.id) {
        const { error: updateError } = await supabase
          .from('window_designs')
          .update(row)
          .eq('id', doc.id)
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from('window_designs')
          .insert([row])
          .select('id')
          .single()
        if (insertError) throw insertError
        if (data?.id) {
          router.replace(`/design/${data.id}`)
        }
      }

      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save design'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b bg-white px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-900 text-lg font-bold text-white">
          S
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <Button onClick={handleSave} disabled={saving || shapes.length === 0}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <ToolSidebar onOpenDetails={() => setDetailsOpen(true)} />

        {detailsOpen && <DetailsPanel onClose={() => setDetailsOpen(false)} />}

        <div className="flex flex-1 flex-col overflow-hidden">
          <EditorToolbar />
          <div className="flex-1 overflow-hidden">
            <DesignCanvas />
          </div>
        </div>
      </div>
    </div>
  )
}
