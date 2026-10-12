'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Save, Send } from 'lucide-react'
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

export default function NewQuotationPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Client information
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')

  // Line items
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: '1',
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
    },
  ])

  // Calculate costs for an item
  const calculateCosts = (item: QuotationItem) => {
    const costs = calculateItemTotal({
      dimensions: { width: item.width, height: item.height },
      profileType: item.profileType,
      profileWeightPerMeter: 1.5, // Default: 1.5 kg/m
      profileCostPerKg: 250, // Default: ₹250/kg
      glassType: item.glassType,
      glassThickness: 5, // Default: 5mm
      glassCostPerSqft: 80, // Default: ₹80/sqft
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

  // Update item and recalculate
  const updateItem = (id: string, updates: Partial<QuotationItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates }
        return calculateCosts(updated)
      }
      return item
    }))
  }

  // Add new item
  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
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
    }
    setItems([...items, calculateCosts(newItem)])
  }

  // Remove item
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  // Calculate total
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0)

  // Save quotation
  const saveQuotation = async (status: 'draft' | 'sent') => {
    if (!clientName || !clientPhone) {
      setError('Client name and phone are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in')
        return
      }

      // Prepare items data
      const itemsData = items.map(item => ({
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
      }))

      // Insert quotation
      const { data, error: insertError } = await supabase
        .from('quotations')
        .insert([
          {
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            status: status,
            total_amount: grandTotal,
            items: itemsData,
            notes: notes,
            valid_until: validUntil || null,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Redirect to quotations list
      router.push('/dashboard/quotations')
    } catch (err: any) {
      setError(err.message || 'Failed to save quotation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Quotation</h1>
          <p className="text-gray-600 mt-1">
            Create a new quotation with auto-calculated pricing
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                required
              />
            </div>
            <div>
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
            <div>
              <Label htmlFor="clientEmail">Email (Optional)</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Window Items</CardTitle>
          <Button onClick={addItem} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Item {index + 1}</h4>
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
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

                <div>
                  <Label>Width (mm)</Label>
                  <Input
                    type="number"
                    value={item.width}
                    onChange={(e) => updateItem(item.id, { width: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label>Height (mm)</Label>
                  <Input
                    type="number"
                    value={item.height}
                    onChange={(e) => updateItem(item.id, { height: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <Label>Profile Type</Label>
                  <Select
                    value={item.profileType}
                    onChange={(e) => updateItem(item.id, { profileType: e.target.value })}
                  >
                    <option value="aluminium">Aluminium</option>
                    <option value="upvc">UPVC</option>
                  </Select>
                </div>

                <div>
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

                <div>
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

                <div>
                  <Label>Accessories (₹)</Label>
                  <Input
                    type="number"
                    value={item.accessories}
                    onChange={(e) => updateItem(item.id, { accessories: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Profile</p>
                    <p className="font-medium">{formatCurrency(item.profileCost)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Glass</p>
                    <p className="font-medium">{formatCurrency(item.glassCost)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Labour</p>
                    <p className="font-medium">{formatCurrency(item.labourCost)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Accessories</p>
                    <p className="font-medium">{formatCurrency(item.accessoriesCost)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="font-bold text-lg">{formatCurrency(item.total)}</p>
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
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or terms..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span>Total Items:</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Total Quantity:</span>
              <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-blue-600 pt-4 border-t">
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => saveQuotation('draft')}
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
        <Button
          onClick={() => saveQuotation('sent')}
          disabled={loading}
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save & Send'}
        </Button>
      </div>
    </div>
  )
}
