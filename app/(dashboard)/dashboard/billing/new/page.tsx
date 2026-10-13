'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard/page-header'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface QuotationOption {
  id: string
  quotation_number: string
  client_id: string | null
  client_name: string
  total_amount: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createClient()

  const [quotations, setQuotations] = useState<QuotationOption[]>([])
  const [quotationId, setQuotationId] = useState('')
  const [amount, setAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load quotations that can be invoiced.
  useEffect(() => {
    let active = true
    void (async () => {
      const { data } = await supabase
        .from('quotations')
        .select('id, quotation_number, client_id, client_name, total_amount')
        .order('created_at', { ascending: false })
      if (!active) return
      setQuotations((data as QuotationOption[]) ?? [])
    })()
    return () => {
      active = false
    }
  }, [supabase])

  const selected = quotations.find((q) => q.id === quotationId)

  // Prefill the amount from the chosen quotation.
  const handleSelectQuotation = (id: string) => {
    setQuotationId(id)
    const q = quotations.find((x) => x.id === id)
    if (q) setAmount(String(q.total_amount ?? ''))
  }

  const amountNum = Number(amount) || 0
  const paidNum = Number(paidAmount) || 0
  const status = paidNum <= 0 ? 'pending' : paidNum >= amountNum ? 'paid' : 'partial'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!quotationId) {
      setError('Select a quotation to invoice.')
      return
    }
    if (amountNum <= 0) {
      setError('Enter an invoice amount greater than zero.')
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in.')
        return
      }

      const { error: insertError } = await supabase.from('invoices').insert([
        {
          quotation_id: quotationId,
          client_id: selected?.client_id ?? null,
          amount: amountNum,
          paid_amount: paidNum,
          status,
          due_date: dueDate || null,
          created_by: user.id,
        },
      ])
      if (insertError) throw insertError

      router.push('/dashboard/billing')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="New Invoice" description="Create an invoice from a quotation.">
        <Link href="/dashboard/billing">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Billing
          </Button>
        </Link>
      </PageHeader>

      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="quotation">Quotation *</Label>
              <Select
                id="quotation"
                value={quotationId}
                onChange={(e) => handleSelectQuotation(e.target.value)}
              >
                <option value="">Select a quotation...</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quotation_number} — {q.client_name} ({formatCurrency(q.total_amount)})
                  </option>
                ))}
              </Select>
              {quotations.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No quotations yet.{' '}
                  <Link href="/dashboard/quotations/new" className="text-primary hover:underline">
                    Create one first
                  </Link>
                  .
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paid">Amount Paid (₹)</Label>
                <Input
                  id="paid"
                  type="number"
                  min={0}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="due">Due Date</Label>
                <Input
                  id="due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <div className="flex h-10 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm capitalize text-foreground">
                  {status}
                </div>
              </div>
            </div>

            {amountNum > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Balance due</span>
                <span className="font-semibold text-heading">
                  {formatCurrency(Math.max(0, amountNum - paidNum))}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
