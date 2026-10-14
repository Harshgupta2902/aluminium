'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, Trash2, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  computeQuotationPrice,
  type QuotationOverheads,
} from '@/lib/quotation-pricing'

interface CostHead {
  id: string
  label: string
  amount: number
}

export function QuotationPricing({
  quotationId,
  designs,
  initialOverheads,
  initialCostHeads,
}: {
  quotationId: string
  designs: { area_sqft: number; amount: number }[]
  initialOverheads: QuotationOverheads
  initialCostHeads: CostHead[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const [o, setO] = useState<QuotationOverheads>(initialOverheads)
  const [heads, setHeads] = useState<CostHead[]>(initialCostHeads)
  const [autoStatus, setAutoStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  const price = useMemo(
    () => computeQuotationPrice(designs, o, heads),
    [designs, o, heads]
  )

  const set = <K extends keyof QuotationOverheads>(k: K, v: QuotationOverheads[K]) =>
    setO((prev) => ({ ...prev, [k]: v }))

  const toggleGst = (which: 'cgst_sgst' | 'igst') => {
    setO((prev) => ({ ...prev, gst_mode: prev.gst_mode === which ? 'none' : which }))
  }

  const addHead = () =>
    setHeads((prev) => [...prev, { id: `new-${Date.now()}`, label: '', amount: 0 }])

  const removeHead = (id: string) => setHeads((prev) => prev.filter((h) => h.id !== id))

  const save = async (
    oo: QuotationOverheads,
    hh: CostHead[],
    grandTotal: number
  ) => {
    setAutoStatus('saving')
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in.')
        setAutoStatus('idle')
        return
      }

      // Persist overheads + the computed grand total on the quotation.
      const { error: upErr } = await supabase
        .from('quotations')
        .update({
          profit_percentage: oo.profit_percentage,
          installation_charge: oo.installation_charge,
          labour_charge: oo.labour_charge,
          profile_wastage: oo.profile_wastage,
          glass_wastage: oo.glass_wastage,
          transport_charge: oo.transport_charge,
          discount: oo.discount,
          discount_type: oo.discount_type,
          cgst: oo.cgst,
          sgst: oo.sgst,
          igst: oo.igst,
          gst_mode: oo.gst_mode,
          grand_total: grandTotal,
          total_amount: grandTotal,
        })
        .eq('id', quotationId)
      if (upErr) throw upErr

      // Replace the custom cost heads (simple + reliable).
      await supabase.from('quotation_cost_heads').delete().eq('quotation_id', quotationId)
      const valid = hh.filter((h) => h.label.trim())
      if (valid.length > 0) {
        const { error: insErr } = await supabase.from('quotation_cost_heads').insert(
          valid.map((h, i) => ({
            quotation_id: quotationId,
            label: h.label.trim(),
            amount: Number(h.amount) || 0,
            sort_order: i,
            created_by: user.id,
          }))
        )
        if (insErr) throw insErr
      }

      setAutoStatus('saved')
      setTimeout(() => setAutoStatus('idle'), 1500)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing')
      setAutoStatus('idle')
    }
  }

  // Debounced autosave whenever overheads or cost heads change (skip first render).
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const t = setTimeout(() => {
      void save(o, heads, price.grandTotal)
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o, heads, price.grandTotal])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Cost Overheads */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-heading">Cost Overheads</h2>
            <p className="text-xs text-muted-foreground">Manage project cost parameters</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {autoStatus === 'saving' && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </>
            )}
            {autoStatus === 'saved' && (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Saved
              </>
            )}
            {autoStatus === 'idle' && <span>Changes save automatically</span>}
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
        )}

        <div className="space-y-2">
          <Overhead label="Profit Percentage" unit="%">
            <NumInput value={o.profit_percentage} onChange={(v) => set('profit_percentage', v)} />
          </Overhead>
          <Overhead label="Installation Charge" unit="₹/Sqft">
            <NumInput value={o.installation_charge} onChange={(v) => set('installation_charge', v)} />
          </Overhead>
          <Overhead label="Labour Charge" unit="₹/Sqft">
            <NumInput value={o.labour_charge} onChange={(v) => set('labour_charge', v)} />
          </Overhead>
          <Overhead label="Profile Wastage" unit="%">
            <NumInput value={o.profile_wastage} onChange={(v) => set('profile_wastage', v)} />
          </Overhead>
          <Overhead label="Glass Wastage" unit="%">
            <NumInput value={o.glass_wastage} onChange={(v) => set('glass_wastage', v)} />
          </Overhead>
          <Overhead label="Transport Charge" unit="₹">
            <NumInput value={o.transport_charge} onChange={(v) => set('transport_charge', v)} />
          </Overhead>

          <Overhead label="Discount">
            <div className="flex gap-2">
              <Select
                value={o.discount_type}
                onChange={(e) => set('discount_type', e.target.value as 'percentage' | 'fixed')}
                className="h-9 w-32"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </Select>
              <NumInput value={o.discount} onChange={(v) => set('discount', v)} />
            </div>
          </Overhead>

          <Overhead label="GST">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={o.gst_mode === 'cgst_sgst'}
                  onChange={() => toggleGst('cgst_sgst')}
                />
                CGST + SGST
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={o.gst_mode === 'igst'}
                  onChange={() => toggleGst('igst')}
                />
                IGST
              </label>
              {o.gst_mode === 'cgst_sgst' && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <NumInput value={o.cgst} onChange={(v) => set('cgst', v)} className="h-8 w-16" />%
                  <NumInput value={o.sgst} onChange={(v) => set('sgst', v)} className="h-8 w-16" />%
                </span>
              )}
              {o.gst_mode === 'igst' && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <NumInput value={o.igst} onChange={(v) => set('igst', v)} className="h-8 w-16" />%
                </span>
              )}
            </div>
          </Overhead>

          {/* Custom cost heads */}
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Custom cost heads
              </p>
              <Button size="sm" variant="outline" onClick={addHead}>
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
            {heads.length === 0 ? (
              <p className="text-xs text-muted-foreground">No custom cost heads.</p>
            ) : (
              <div className="space-y-1.5">
                {heads.map((h) => (
                  <div key={h.id} className="flex items-center gap-2">
                    <Input
                      value={h.label}
                      placeholder="Cost head"
                      onChange={(e) =>
                        setHeads((prev) =>
                          prev.map((x) => (x.id === h.id ? { ...x, label: e.target.value } : x))
                        )
                      }
                      className="h-9 flex-1"
                    />
                    <NumInput
                      value={h.amount}
                      onChange={(v) =>
                        setHeads((prev) =>
                          prev.map((x) => (x.id === h.id ? { ...x, amount: v } : x))
                        )
                      }
                      className="h-9 w-28"
                    />
                    <button
                      type="button"
                      onClick={() => removeHead(h.id)}
                      className="flex h-8 w-8 items-center justify-center rounded text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Summary */}
      <div className="h-fit rounded-xl bg-gradient-to-br from-primary to-sky-500 p-5 text-white shadow-lg">
        <h3 className="mb-3 border-b border-white/25 pb-2 text-base font-bold">Price Summary</h3>
        <div className="space-y-1.5 text-sm">
          <SumRow label="Base Charge" value={price.base} />
          {price.installation > 0 && <SumRow label="Installation" value={price.installation} />}
          {price.labour > 0 && <SumRow label="Labour" value={price.labour} />}
          {price.profit > 0 && <SumRow label="Profit" value={price.profit} />}
          {price.wastage > 0 && <SumRow label="Wastage" value={price.wastage} />}
          {price.customHeads > 0 && <SumRow label="Custom Heads" value={price.customHeads} />}
          {price.transport > 0 && <SumRow label="Transportation" value={price.transport} />}
          {price.discountAmount > 0 && (
            <SumRow label="Discount" value={-price.discountAmount} />
          )}
          <div className="border-t border-white/20 pt-1.5">
            <SumRow label="Sub Total" value={price.subtotal} bold />
          </div>
          {price.cgstAmount > 0 && <SumRow label={`CGST ${o.cgst}%`} value={price.cgstAmount} />}
          {price.sgstAmount > 0 && <SumRow label={`SGST ${o.sgst}%`} value={price.sgstAmount} />}
          {price.igstAmount > 0 && <SumRow label={`IGST ${o.igst}%`} value={price.igstAmount} />}
          <div className="mt-1 flex items-center justify-between border-t border-white/25 pt-2 text-base font-bold">
            <span>Grand Total</span>
            <span>{formatCurrency(price.grandTotal)}</span>
          </div>
          <p className="pt-1 text-[11px] text-white/70">
            {price.totalArea.toFixed(2)} Sqft
            {price.totalArea > 0 && ` · ${formatCurrency(Math.round(price.grandTotal / price.totalArea))}/Sqft`}
          </p>
        </div>
      </div>
    </div>
  )
}

function Overhead({
  label,
  unit,
  children,
}: {
  label: string
  unit?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2">
      <span className="w-40 shrink-0 text-sm text-foreground">{label}</span>
      <div className="flex-1">{children}</div>
      {unit && <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{unit}</span>}
    </div>
  )
}

function NumInput({
  value,
  onChange,
  className = 'h-9 w-full',
}: {
  value: number
  onChange: (v: number) => void
  className?: string
}) {
  return (
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className={className}
    />
  )
}

function SumRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold' : ''}`}>
      <span className="text-white/85">{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  )
}
