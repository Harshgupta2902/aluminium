import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { AdminUserRow } from './actions'

/**
 * Load every non-superadmin user with their active billing period and the
 * number of quotations they've used within it. Superadmin-only (RLS + the
 * admin layout guard enforce access).
 */
export async function loadAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: profiles } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, company_name, phone, role, is_active, can_access_designs, can_access_billing, can_access_inventory, created_at'
    )
    .order('created_at', { ascending: false })

  const users = (profiles ?? []).filter((p) => p.role !== 'superadmin')
  if (users.length === 0) return []

  const ids = users.map((u) => u.id)

  // Active billing period per user (one covering today).
  const { data: periods } = await supabase
    .from('billing_periods')
    .select('user_id, plan_name, ends_at, starts_at, quotation_limit, is_paid')
    .in('user_id', ids)
    .lte('starts_at', today)
    .gte('ends_at', today)

  const periodByUser = new Map<string, {
    plan_name: string
    ends_at: string
    starts_at: string
    quotation_limit: number | null
    is_paid: boolean
  }>()
  for (const p of periods ?? []) {
    // Keep the latest-ending active period if multiple.
    const existing = periodByUser.get(p.user_id)
    if (!existing || p.ends_at > existing.ends_at) periodByUser.set(p.user_id, p)
  }

  // Count quotations per user within their active period.
  const usedByUser = new Map<string, number>()
  await Promise.all(
    users.map(async (u) => {
      const period = periodByUser.get(u.id)
      if (!period) return
      const { count } = await supabase
        .from('quotations')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', u.id)
        .gte('created_at', period.starts_at)
        .lte('created_at', `${period.ends_at}T23:59:59.999Z`)
      usedByUser.set(u.id, count ?? 0)
    })
  )

  return users.map((u) => {
    const period = periodByUser.get(u.id)
    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      company_name: u.company_name,
      phone: u.phone ?? null,
      role: u.role,
      is_active: u.is_active,
      can_access_designs: u.can_access_designs,
      can_access_billing: u.can_access_billing,
      can_access_inventory: u.can_access_inventory,
      created_at: u.created_at,
      plan_name: period?.plan_name ?? null,
      period_ends: period?.ends_at ?? null,
      quotation_limit: period?.quotation_limit ?? null,
      is_paid: period?.is_paid ?? null,
      quotations_used: usedByUser.get(u.id) ?? 0,
    }
  })
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  expiredUsers: number
  totalQuotations: number
  totalDesigns: number
  billingPaid: number
  billingUnpaid: number
  revenueCollected: number
  revenuePending: number
  /** Quotations created per month across all users, last 7 months. */
  quotationsByMonth: { month: string; count: number }[]
}

/**
 * Aggregate KPIs for the admin dashboard. Superadmin RLS lets these counts span
 * every user's data.
 */
export async function loadAdminStats(): Promise<AdminStats> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const users = await loadAdminUsers()
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.is_active).length
  const inactiveUsers = totalUsers - activeUsers
  const expiredUsers = users.filter(
    (u) => u.is_active && (!u.period_ends || u.period_ends < today)
  ).length

  const [{ count: totalQuotations }, { count: totalDesigns }] = await Promise.all([
    supabase.from('quotations').select('id', { count: 'exact', head: true }),
    supabase.from('window_designs').select('id', { count: 'exact', head: true }),
  ])

  // Billing paid/unpaid + revenue across all billing periods.
  const { data: periods } = await supabase
    .from('billing_periods')
    .select('amount, is_paid')
  let billingPaid = 0
  let billingUnpaid = 0
  let revenueCollected = 0
  let revenuePending = 0
  for (const p of periods ?? []) {
    if (p.is_paid) {
      billingPaid += 1
      revenueCollected += Number(p.amount) || 0
    } else {
      billingUnpaid += 1
      revenuePending += Number(p.amount) || 0
    }
  }

  // Quotations per month (last 7 months) across all users.
  const now = new Date()
  const buckets: { key: string; month: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      count: 0,
    })
  }
  const since = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString()
  const { data: qRows } = await supabase
    .from('quotations')
    .select('created_at')
    .gte('created_at', since)
  for (const q of qRows ?? []) {
    const d = new Date(q.created_at as string)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const bucket = buckets.find((b) => b.key === key)
    if (bucket) bucket.count += 1
  }

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    expiredUsers,
    totalQuotations: totalQuotations ?? 0,
    totalDesigns: totalDesigns ?? 0,
    billingPaid,
    billingUnpaid,
    revenueCollected,
    revenuePending,
    quotationsByMonth: buckets.map(({ month, count }) => ({ month, count })),
  }
}


/* ------------------------------------------------------------------ *
 * Leads
 * ------------------------------------------------------------------ */

export interface AdminLeadRow {
  id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string | null
  company_name: string | null
  plan_id: string | null
  plan_name: string | null
  status: 'new' | 'contacted' | 'billing_sent' | 'won' | 'rejected'
  notes: string | null
  billing_period_id: string | null
  created_at: string
  // Joined plan details (price/limit/interval) for billing generation.
  plan_price: number | null
  plan_interval: string | null
  plan_quotation_limit: number | null
}

/** Load all leads (superadmin only, enforced by RLS + the admin layout). */
export async function loadLeads(): Promise<AdminLeadRow[]> {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select(
      'id, user_id, full_name, email, phone, company_name, plan_id, plan_name, status, notes, billing_period_id, created_at'
    )
    .order('created_at', { ascending: false })

  const rows = leads ?? []
  if (rows.length === 0) return []

  // Join plan pricing for the billing-generation form.
  const planIds = Array.from(new Set(rows.map((l) => l.plan_id).filter(Boolean))) as string[]
  const planById = new Map<
    string,
    { price: number; billing_interval: string; quotation_limit: number | null }
  >()
  if (planIds.length > 0) {
    const { data: plans } = await supabase
      .from('plans')
      .select('id, price, billing_interval, quotation_limit')
      .in('id', planIds)
    for (const p of plans ?? []) {
      planById.set(p.id, {
        price: Number(p.price) || 0,
        billing_interval: p.billing_interval,
        quotation_limit: p.quotation_limit,
      })
    }
  }

  return rows.map((l) => {
    const plan = l.plan_id ? planById.get(l.plan_id) : undefined
    return {
      id: l.id,
      user_id: l.user_id,
      full_name: l.full_name,
      email: l.email,
      phone: l.phone,
      company_name: l.company_name,
      plan_id: l.plan_id,
      plan_name: l.plan_name,
      status: l.status,
      notes: l.notes,
      billing_period_id: l.billing_period_id,
      created_at: l.created_at,
      plan_price: plan?.price ?? null,
      plan_interval: plan?.billing_interval ?? null,
      plan_quotation_limit: plan?.quotation_limit ?? null,
    }
  })
}
