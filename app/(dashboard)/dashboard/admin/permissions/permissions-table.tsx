'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { updateUserAccount } from '../actions'
import { UserCell } from '@/components/admin/ui'

interface PermRow {
  id: string
  full_name: string
  email: string
  is_active: boolean
  can_access_designs: boolean
  can_access_billing: boolean
  can_access_inventory: boolean
}

type PermKey = 'is_active' | 'can_access_designs' | 'can_access_billing' | 'can_access_inventory'

const FIELD_TO_INPUT: Record<PermKey, 'isActive' | 'canAccessDesigns' | 'canAccessBilling' | 'canAccessInventory'> = {
  is_active: 'isActive',
  can_access_designs: 'canAccessDesigns',
  can_access_billing: 'canAccessBilling',
  can_access_inventory: 'canAccessInventory',
}

export function PermissionsTable({ users }: { users: PermRow[] }) {
  const router = useRouter()
  const [rows, setRows] = useState<PermRow[]>(users)
  const [pending, startTransition] = useTransition()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggle = (id: string, key: PermKey, next: boolean) => {
    // Optimistic update.
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: next } : r)))
    setSavingId(id)
    setError(null)
    startTransition(async () => {
      const res = await updateUserAccount({ id, [FIELD_TO_INPUT[key]]: next })
      setSavingId(null)
      if (!res.success) {
        setError(res.error)
        // Revert on failure.
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: !next } : r)))
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div>
      {error && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 text-center">Account active</th>
              <th className="px-4 py-3 text-center">Designs</th>
              <th className="px-4 py-3 text-center">Billing</th>
              <th className="px-4 py-3 text-center">Inventory</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <UserCell name={u.full_name} email={u.email} />
                    {pending && savingId === u.id && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </td>
                <Cell checked={u.is_active} onChange={(v) => toggle(u.id, 'is_active', v)} />
                <Cell checked={u.can_access_designs} onChange={(v) => toggle(u.id, 'can_access_designs', v)} />
                <Cell checked={u.can_access_billing} onChange={(v) => toggle(u.id, 'can_access_billing', v)} />
                <Cell checked={u.can_access_inventory} onChange={(v) => toggle(u.id, 'can_access_inventory', v)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Cell({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <td className="px-4 py-3 text-center">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </td>
  )
}
