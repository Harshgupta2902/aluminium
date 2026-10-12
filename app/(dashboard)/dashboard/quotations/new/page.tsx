'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/dashboard/page-header'
import { Plus, Trash2, Send, Check, Loader2, CloudOff } from 'lucide-react'
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
  const supabase = createClient()

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Client information
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')

  // Line items — initialized with computed costs so totals show immediately.
  const [items, setItems] = useState<QuotationItem[]>(() => [createItem('1')])

  // Autosave bookkeeping
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const quotationIdRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)

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

  // Build the row payload shared by autosave and send.
  const buildPayload = useCallback(
    (status: 'draft' | 'sent') => ({
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

      const payload = buildPayload('draft')

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
  }, [buildPayload, clientName, clientPhone, supabase])

  // Debounced autosave: fires 1.5s after the latest change.
  useEffect(() => {
    if (!clientName.trim() || !clientPhone.trim()) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      persistDraft()
    }, 1500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // Re-run whenever any field that feeds buildPayload changes.
  }, [clientName, clientEmail, clientPhone, notes, validUntil, items, persistDraft])

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

      const payload = buildPayload('sent')

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
        title="New Quotation"
        description="Create a quotation with auto-calculated pricing. Drafts save automatically."
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
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                <h4 className="text-sm font-semibold text-heading">Item {index + 1}</h4>
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
