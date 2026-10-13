'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/dashboard/page-header'
import { DesignPreview } from '@/components/design-editor/design-preview'
import {
  Plus,
  Trash2,
  Send,
  Check,
  Loader2,
  CloudOff,
  UserPlus,
  Pencil,
  LayoutGrid,
  X,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DesignDocument } from '@/lib/design-editor/model'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface ClientOption {
  id: string
  name: string
  email: string | null
  phone: string
  company: string | null
}

/** A design row linked to (or linkable to) a quotation. */
interface DesignRow {
  id: string
  name: string
  quotation_id: string | null
  area_sqft: number
  rate_per_sqft: number
  amount: number
  editor_document: DesignDocument | null
}

const NEW_CLIENT = '__new__'

export default function NewQuotationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectClientId = searchParams.get('client')
  const editId = searchParams.get('edit')
  const supabase = createClient()

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Blocks autosave until an edited quotation finishes loading.
  const [hydrated, setHydrated] = useState(!editId)

  // Client information
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>(NEW_CLIENT)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')

  // Designs linked to this quotation.
  const [designs, setDesigns] = useState<DesignRow[]>([])

  // Catalogue picker.
  const [catalogueOpen, setCatalogueOpen] = useState(false)

  // The client_id persisted on the quotation.
  const clientIdRef = useRef<string | null>(null)

  // Autosave bookkeeping
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const quotationIdRef = useRef<string | null>(editId ?? null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)

  // Load existing clients for the picker (and preselect from ?client=).
  useEffect(() => {
    let active = true
    supabase
      .from('clients')
      .select('id, name, email, phone, company')
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (!active || !data) return
        const list = data as ClientOption[]
        setClients(list)

        const match = preselectClientId
          ? list.find((c) => c.id === preselectClientId)
          : undefined
        if (match) {
          setSelectedClientId(match.id)
          clientIdRef.current = match.id
          setClientName(match.name)
          setClientEmail(match.email || '')
          setClientPhone(match.phone)
        }
      })
    return () => {
      active = false
    }
  }, [supabase, preselectClientId])

  // Load the designs linked to a quotation.
  const refreshDesigns = useCallback(
    async (quotationId: string) => {
      const { data } = await supabase
        .from('window_designs')
        .select('id, name, quotation_id, area_sqft, rate_per_sqft, amount, editor_document')
        .eq('quotation_id', quotationId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      setDesigns((data as DesignRow[]) ?? [])
    },
    [supabase]
  )

  // Edit mode: load the existing quotation + its designs.
  useEffect(() => {
    if (!editId) return
    let active = true

    async function loadQuotation() {
      const { data, error: loadError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', editId)
        .single()

      if (!active) return
      if (loadError || !data) {
        setError('Could not load this quotation for editing.')
        setHydrated(true)
        return
      }

      quotationIdRef.current = data.id
      setClientName(data.client_name || '')
      setClientEmail(data.client_email || '')
      setClientPhone(data.client_phone || '')
      setNotes(data.notes || '')
      setValidUntil(data.valid_until || '')
      if (data.client_id) {
        clientIdRef.current = data.client_id
        setSelectedClientId(data.client_id)
      }

      await refreshDesigns(data.id)
      setHydrated(true)
    }

    loadQuotation()
    return () => {
      active = false
    }
  }, [editId, supabase, refreshDesigns])

  const handleSelectClient = (value: string) => {
    setSelectedClientId(value)
    if (value === NEW_CLIENT) {
      clientIdRef.current = null
      setClientName('')
      setClientEmail('')
      setClientPhone('')
      return
    }
    const chosen = clients.find((c) => c.id === value)
    if (chosen) {
      clientIdRef.current = chosen.id
      setClientName(chosen.name)
      setClientEmail(chosen.email || '')
      setClientPhone(chosen.phone)
    }
  }

  // Totals are the aggregate of the linked designs.
  const totalArea = designs.reduce((sum, d) => sum + (d.area_sqft || 0), 0)
  const grandTotal = designs.reduce((sum, d) => sum + (d.amount || 0), 0)

  // Resolve the client to link. Reuses the selected/created client, or creates
  // a new clients row (deduped by phone) when entering a new client.
  const resolveClientId = useCallback(
    async (userId: string): Promise<string | null> => {
      if (clientIdRef.current) return clientIdRef.current

      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', clientPhone.trim())
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        clientIdRef.current = existing.id
        return existing.id
      }

      const { data: created, error: createError } = await supabase
        .from('clients')
        .insert([
          {
            name: clientName.trim(),
            email: clientEmail.trim() || null,
            phone: clientPhone.trim(),
            created_by: userId,
          },
        ])
        .select('id')
        .single()

      if (createError) throw createError
      clientIdRef.current = created.id
      return created.id
    },
    [clientName, clientEmail, clientPhone, supabase]
  )

  // The row payload shared by autosave and send.
  const buildPayload = useCallback(
    (status: 'draft' | 'sent', clientId: string | null) => ({
      client_id: clientId,
      client_name: clientName,
      client_email: clientEmail || null,
      client_phone: clientPhone,
      status,
      total_amount: grandTotal,
      notes: notes || null,
      valid_until: validUntil || null,
    }),
    [clientName, clientEmail, clientPhone, grandTotal, notes, validUntil]
  )

  // Persist the current state as a draft; returns the quotation id (or null).
  const persistDraft = useCallback(async (): Promise<string | null> => {
    if (!clientName.trim() || !clientPhone.trim()) return quotationIdRef.current
    if (savingRef.current) return quotationIdRef.current

    savingRef.current = true
    setSaveState('saving')
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setSaveState('error')
        setError('You must be logged in to save.')
        return null
      }

      const clientId = await resolveClientId(user.id)
      const payload = buildPayload('draft', clientId)

      if (quotationIdRef.current) {
        const { error: updateError } = await supabase
          .from('quotations')
          .update(payload)
          .eq('id', quotationIdRef.current)
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from('quotations')
          .insert([{ ...payload, created_by: user.id }])
          .select('id')
          .single()
        if (insertError) throw insertError
        quotationIdRef.current = data.id
      }

      setSaveState('saved')
      setSavedAt(new Date())
      return quotationIdRef.current
    } catch (err) {
      setSaveState('error')
      setError(err instanceof Error ? err.message : 'Autosave failed')
      return null
    } finally {
      savingRef.current = false
    }
  }, [buildPayload, clientName, clientPhone, resolveClientId, supabase])

  // Debounced autosave for the quotation header fields (client/notes/validity).
  useEffect(() => {
    if (!hydrated) return
    if (!clientName.trim() || !clientPhone.trim()) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      persistDraft()
    }, 1500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [hydrated, clientName, clientEmail, clientPhone, notes, validUntil, persistDraft])

  // Open the design editor for a new design belonging to this quotation.
  const addDesign = async () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Enter client name and phone before adding a design.')
      return
    }
    const id = await persistDraft()
    if (!id) return
    router.push(`/design/new?quotationId=${id}`)
  }

  const editDesign = (designId: string) => {
    const id = quotationIdRef.current
    router.push(
      id ? `/design/${designId}?quotationId=${id}` : `/design/${designId}`
    )
  }

  const removeDesign = async (designId: string) => {
    const { error: delError } = await supabase
      .from('window_designs')
      .delete()
      .eq('id', designId)
    if (delError) {
      setError(delError.message)
      return
    }
    setDesigns((prev) => prev.filter((d) => d.id !== designId))
  }

  // Clone a catalogue design onto this quotation.
  const addFromCatalogue = async (source: DesignRow) => {
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Enter client name and phone before adding a design.')
      return
    }
    const quotationId = await persistDraft()
    if (!quotationId) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in.')
      return
    }

    // Pull the full source row so we clone every column.
    const { data: full } = await supabase
      .from('window_designs')
      .select('*')
      .eq('id', source.id)
      .single()
    if (!full) return

    // Clone every column except identity / linkage ones.
    const rest = { ...(full as Record<string, unknown>) }
    delete rest.id
    delete rest.created_at
    delete rest.updated_at
    delete rest.quotation_id

    const { error: insertError } = await supabase
      .from('window_designs')
      .insert([
        {
          ...rest,
          quotation_id: quotationId,
          sort_order: designs.length,
          created_by: user.id,
        },
      ])
    if (insertError) {
      setError(insertError.message)
      return
    }

    setCatalogueOpen(false)
    await refreshDesigns(quotationId)
  }

  const sendQuotation = async () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Client name and phone are required.')
      return
    }
    if (designs.length === 0) {
      setError('Add at least one design before sending.')
      return
    }

    setSending(true)
    setError(null)

    try {
      const id = await persistDraft()
      if (!id) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in.')
        return
      }

      const clientId = await resolveClientId(user.id)
      const payload = buildPayload('sent', clientId)
      const { error: updateError } = await supabase
        .from('quotations')
        .update(payload)
        .eq('id', id)
      if (updateError) throw updateError

      router.push('/dashboard/quotations')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send quotation')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title={editId ? 'Edit Quotation' : 'New Quotation'}
        description={
          editId
            ? 'Update this quotation and its designs. Changes save automatically.'
            : 'Create a quotation, then add one or more window designs. Drafts save automatically.'
        }
      >
        <SaveStatus state={saveState} savedAt={savedAt} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          disabled={sending}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={sendQuotation} disabled={sending}>
          <Send className="h-4 w-4" />
          {sending ? 'Sending...' : 'Save & Send'}
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </div>
      )}

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="clientSelect">Client</Label>
              <Select
                id="clientSelect"
                value={selectedClientId}
                onChange={(e) => handleSelectClient(e.target.value)}
              >
                <option value={NEW_CLIENT}>+ New client</option>
                {clients.length > 0 && (
                  <optgroup label="Existing clients">
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.phone ? ` — ${c.phone}` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {selectedClientId === NEW_CLIENT ? (
            <div className="space-y-3 border-t border-border/60 pt-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientPhone">Phone Number *</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientEmail">Email (optional)</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserPlus className="h-3.5 w-3.5" />
                This client will be saved to your client list automatically.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {clientName.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-heading">
                    {clientName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {clientPhone}
                    {clientEmail ? ` · ${clientEmail}` : ''}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleSelectClient(NEW_CLIENT)}
              >
                Change
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Designs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Designs</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCatalogueOpen(true)}
              size="sm"
              variant="outline"
            >
              <LayoutGrid className="h-4 w-4" />
              From Catalogue
            </Button>
            <Button onClick={addDesign} size="sm">
              <Plus className="h-4 w-4" />
              Add Design
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {designs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No designs yet. Draw a new one or add from the catalogue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-center rounded-md bg-secondary/40 p-2">
                    {design.editor_document ? (
                      <DesignPreview
                        document={design.editor_document}
                        width={240}
                        height={170}
                      />
                    ) : (
                      <div className="flex h-[170px] w-[240px] items-center justify-center text-xs text-muted-foreground">
                        No preview
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-heading">
                        {design.name || 'Untitled design'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Number(design.area_sqft).toFixed(2)} Sqft ·{' '}
                        {formatCurrency(design.rate_per_sqft)}/Sqft
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-primary">
                      {formatCurrency(design.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => editDesign(design.id)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit design
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => removeDesign(design.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or terms..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Designs</span>
              <span className="font-medium text-foreground">
                {designs.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Area</span>
              <span className="font-medium text-foreground">
                {totalArea.toFixed(2)} Sqft
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-lg font-bold text-primary">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {catalogueOpen && (
        <CatalogueDialog
          onClose={() => setCatalogueOpen(false)}
          onPick={addFromCatalogue}
        />
      )}
    </div>
  )
}

/** Modal listing saved designs to clone onto the current quotation. */
function CatalogueDialog({
  onClose,
  onPick,
}: {
  onClose: () => void
  onPick: (design: DesignRow) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<DesignRow[]>([])

  useEffect(() => {
    let active = true
    supabase
      .from('window_designs')
      .select('id, name, quotation_id, area_sqft, rate_per_sqft, amount, editor_document')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (!active) return
        setItems((data as DesignRow[]) ?? [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [supabase])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-heading">
            Add from Catalogue
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading designs...
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No saved designs yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onPick(d)}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border p-2 text-left transition-colors hover:border-primary hover:bg-primary-soft/40"
                >
                  <div className="flex w-full items-center justify-center rounded bg-secondary/40 p-1">
                    {d.editor_document ? (
                      <DesignPreview
                        document={d.editor_document}
                        width={160}
                        height={120}
                      />
                    ) : (
                      <div className="h-[120px] w-[160px]" />
                    )}
                  </div>
                  <div className="w-full">
                    <p className="truncate text-xs font-medium text-heading">
                      {d.name || 'Untitled'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {Number(d.area_sqft).toFixed(2)} Sqft
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SaveStatus({
  state,
  savedAt,
}: {
  state: SaveState
  savedAt: Date | null
}) {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving...
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <CloudOff className="h-3.5 w-3.5" />
        Not saved
      </span>
    )
  }
  if (state === 'saved' && savedAt) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <Check className="h-3.5 w-3.5" />
        Saved{' '}
        {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    )
  }
  return null
}
