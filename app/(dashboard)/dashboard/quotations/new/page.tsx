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
import { Plus, Trash2, Send, Check, Loader2, CloudOff, UserPlus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { calculateItemTotal } from '@/lib/calculations'

interface QuotationItem {
  id: string
  windowType: string
  width: number
  height: number
  quantity: number
  profileType: string
  glassType: string
  color: string
  accessories: number
  profileCost: number
  glassCost: number
  labourCost: number
  accessoriesCost: number
  total: number
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface ClientOption {
  id: string
  name: string
  email: string | null
  phone: string
  company: string | null
}

const NEW_CLIENT = '__new__'

// Compute all derived costs for an item from its inputs.
function withCosts(item: QuotationItem): QuotationItem {
  const costs = calculateItemTotal({
    dimensions: { width: item.width, height: item.height },
    profileType: item.profileType,
    profileWeightPerMeter: 1.5, // kg/m
    profileCostPerKg: 250, // ₹/kg
    glassType: item.glassType,
    glassThickness: 5, // mm
    glassCostPerSqft: 80, // ₹/sqft
    accessoriesCost: item.accessories,
    labourCostPerSqft: 50,
    quantity: item.quantity,
    markupPercentage: 15,
  })

  return {
    ...item,
    profileCost: costs.profileCost,
    glassCost: costs.glassCost,
    labourCost: costs.labourCost,
    accessoriesCost: costs.accessoriesCost,
    total: costs.totalWithQuantity,
  }
}

function createItem(id: string): QuotationItem {
  return withCosts({
    id,
    windowType: 'sliding',
    width: 1200,
    height: 1200,
    quantity: 1,
    profileType: 'aluminium',
    glassType: 'clear',
    color: 'white',
    accessories: 0,
    profileCost: 0,
    glassCost: 0,
    labourCost: 0,
    accessoriesCost: 0,
    total: 0,
  })
}

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
  // Selected existing client id, or NEW_CLIENT when entering a new one.
  const [selectedClientId, setSelectedClientId] = useState<string>(NEW_CLIENT)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')

  // The client_id persisted on the quotation (set when an existing client is
  // chosen, or after a new client is auto-created on first save).
  const clientIdRef = useRef<string | null>(null)

  // Load existing clients for the picker. If the page was opened with a
  // ?client=<id> param (e.g. from the Clients page "Quote" button), preselect
  // that client so a new quotation starts linked to them.
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

  // When an existing client is picked, prefill the snapshot fields.
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

  // Line items — initialized with computed costs so totals show immediately.
  const [items, setItems] = useState<QuotationItem[]>(() => [createItem('1')])

  // Autosave bookkeeping
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const quotationIdRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)

  // Edit mode: load the existing quotation into the form. quotationIdRef is set
  // so autosave/send update this row instead of inserting a new one.
  useEffect(() => {
    if (!editId) return
    let active = true

    supabase
      .from('quotations')
      .select('*')
      .eq('id', editId)
      .single()
      .then(({ data, error: loadError }) => {
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

        const loadedItems = Array.isArray(data.items) ? data.items : []
        if (loadedItems.length > 0) {
          setItems(
            loadedItems.map((it: Record<string, unknown>, i: number) =>
              withCosts({
                id: `${Date.now()}-${i}`,
                windowType: (it.window_type as string) || 'sliding',
                width: (it.dimensions as { width?: number })?.width ?? 1200,
                height: (it.dimensions as { height?: number })?.height ?? 1200,
                quantity: (it.quantity as number) || 1,
                profileType: (it.profile_type as string) || 'aluminium',
                glassType: (it.glass_type as string) || 'clear',
                color: (it.color as string) || 'white',
                accessories: (it.accessories_cost as number) || 0,
                profileCost: 0,
                glassCost: 0,
                labourCost: 0,
                accessoriesCost: 0,
                total: 0,
              })
            )
          )
        }

        setHydrated(true)
      })

    return () => {
      active = false
    }
  }, [editId, supabase])

  const updateItem = (id: string, updates: Partial<QuotationItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? withCosts({ ...item, ...updates }) : item
      )
    )
  }

  const addItem = () => {
    setItems((prev) => [...prev, createItem(Date.now().toString())])
  }

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev))
  }

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  // Resolve the client to link. Reuses the selected/created client, or creates
  // a new clients row (deduped by phone) when entering a new client.
  const resolveClientId = useCallback(
    async (userId: string): Promise<string | null> => {
      if (clientIdRef.current) return clientIdRef.current

      // New client flow: try to match an existing one by phone first.
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

  // Build the row payload shared by autosave and send.
  const buildPayload = useCallback(
    (status: 'draft' | 'sent', clientId: string | null) => ({
      client_id: clientId,
      client_name: clientName,
      client_email: clientEmail || null,
      client_phone: clientPhone,
      status,
      total_amount: grandTotal,
      items: items.map((item) => ({
        window_type: item.windowType,
        dimensions: { width: item.width, height: item.height },
        quantity: item.quantity,
        profile_type: item.profileType,
        glass_type: item.glassType,
        color: item.color,
        accessories: [],
        profile_cost: item.profileCost,
        glass_cost: item.glassCost,
        accessories_cost: item.accessoriesCost,
        labour_cost: item.labourCost,
        total_cost: item.total,
      })),
      notes: notes || null,
      valid_until: validUntil || null,
    }),
    [clientName, clientEmail, clientPhone, grandTotal, items, notes, validUntil]
  )

  // Persist the current state as a draft. Inserts on first call, updates after.
  const persistDraft = useCallback(async () => {
    // The quotations table requires client_name and client_phone.
    if (!clientName.trim() || !clientPhone.trim()) return
    if (savingRef.current) return

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
        return
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
    } catch (err) {
      setSaveState('error')
      setError(err instanceof Error ? err.message : 'Autosave failed')
    } finally {
      savingRef.current = false
    }
  }, [buildPayload, clientName, clientPhone, resolveClientId, supabase])

  // Debounced autosave: fires 1.5s after the latest change.
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
    // Re-run whenever any field that feeds buildPayload changes.
  }, [hydrated, clientName, clientEmail, clientPhone, notes, validUntil, items, persistDraft])

  const sendQuotation = async () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Client name and phone are required.')
      return
    }

    setSending(true)
    setError(null)

    try {
      // Make sure the latest edits are persisted first.
      await persistDraft()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in.')
        return
      }

      const clientId = await resolveClientId(user.id)
      const payload = buildPayload('sent', clientId)

      if (quotationIdRef.current) {
        const { error: updateError } = await supabase
          .from('quotations')
          .update(payload)
          .eq('id', quotationIdRef.current)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('quotations')
          .insert([{ ...payload, created_by: user.id }])
        if (insertError) throw insertError
      }

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
            ? 'Update this quotation. Changes save automatically.'
            : 'Create a quotation with auto-calculated pricing. Drafts save automatically.'
        }
      >
        <SaveStatus state={saveState} savedAt={savedAt} />
        <Button variant="outline" size="sm" onClick={() => router.back()} disabled={sending}>
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
                  <p className="truncate text-sm font-semibold text-heading">{clientName}</p>
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

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Window Items</CardTitle>
          <Button onClick={addItem} size="sm" variant="outline">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-semibold capitalize text-heading">
                    {item.windowType} Window
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(item.total)}
                  </span>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Window Type</Label>
                  <Select
                    value={item.windowType}
                    onChange={(e) => updateItem(item.id, { windowType: e.target.value })}
                  >
                    <option value="sliding">Sliding</option>
                    <option value="casement">Casement</option>
                    <option value="fixed">Fixed</option>
                    <option value="door">Door</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Width (mm)</Label>
                  <Input
                    type="number"
                    value={item.width}
                    onChange={(e) => updateItem(item.id, { width: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Height (mm)</Label>
                  <Input
                    type="number"
                    value={item.height}
                    onChange={(e) => updateItem(item.id, { height: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Profile Type</Label>
                  <Select
                    value={item.profileType}
                    onChange={(e) => updateItem(item.id, { profileType: e.target.value })}
                  >
                    <option value="aluminium">Aluminium</option>
                    <option value="upvc">UPVC</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Glass Type</Label>
                  <Select
                    value={item.glassType}
                    onChange={(e) => updateItem(item.id, { glassType: e.target.value })}
                  >
                    <option value="clear">Clear</option>
                    <option value="tinted">Tinted</option>
                    <option value="laminated">Laminated</option>
                    <option value="tempered">Tempered</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Color</Label>
                  <Select
                    value={item.color}
                    onChange={(e) => updateItem(item.id, { color: e.target.value })}
                  >
                    <option value="white">White</option>
                    <option value="black">Black</option>
                    <option value="grey">Grey</option>
                    <option value="brown">Brown</option>
                    <option value="wood-finish">Wood Finish</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Accessories (₹)</Label>
                  <Input
                    type="number"
                    value={item.accessories}
                    onChange={(e) => updateItem(item.id, { accessories: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                  <div>
                    <p className="text-xs text-muted-foreground">Profile</p>
                    <p className="font-medium text-foreground">{formatCurrency(item.profileCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Glass</p>
                    <p className="font-medium text-foreground">{formatCurrency(item.glassCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Labour</p>
                    <p className="font-medium text-foreground">{formatCurrency(item.labourCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Accessories</p>
                    <p className="font-medium text-foreground">{formatCurrency(item.accessoriesCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium text-foreground">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Quantity</span>
              <span className="font-medium text-foreground">{totalQuantity}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-lg font-bold text-primary">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SaveStatus({ state, savedAt }: { state: SaveState; savedAt: Date | null }) {
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
