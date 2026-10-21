import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Central place for reading a user's account access state: role, active status,
 * section permissions, and the current billing period (which carries the
 * quotation limit + expiry). Used by the dashboard layout, middleware helpers,
 * and quotation-limit enforcement.
 */

export interface AccessProfile {
  id: string
  email: string
  full_name: string
  company_name: string | null
  role: string
  is_active: boolean
  can_access_designs: boolean
  can_access_billing: boolean
  can_access_inventory: boolean
  /** pending_review (locked to pending dashboard) | active | rejected. */
  account_status: 'pending_review' | 'active' | 'rejected'
}

export interface BillingPeriod {
  id: string
  plan_name: string
  amount: number
  starts_at: string
  ends_at: string
  quotation_limit: number | null
  is_paid: boolean
}

export interface AccessState {
  profile: AccessProfile | null
  /** The billing period covering today, if any. */
  activePeriod: BillingPeriod | null
  /** True when the account is usable (active + not expired). Superadmin always true. */
  allowed: boolean
  reason: 'ok' | 'no-profile' | 'inactive' | 'expired' | 'pending' | 'rejected'
  /**
   * True when the account exists but is awaiting review (self-signup not yet
   * processed). Such users may ONLY reach the pending dashboard — every feature
   * is blocked. Distinct from `inactive`/`expired`, which are hard lockouts.
   */
  pendingReview: boolean
}

/* Supabase client that at minimum supports `.from()` (server or isolated). */
type Client = Pick<SupabaseClient, 'from'>

export function isSuperadmin(profile: AccessProfile | null): boolean {
  return profile?.role === 'superadmin'
}

/**
 * Load the full access state for a given user id. Degrades gracefully if the
 * admin columns / billing_periods table don't exist yet (pre-migration): it
 * treats the account as allowed so the app keeps working during rollout.
 */
export async function getAccessState(
  supabase: Client,
  userId: string
): Promise<AccessState> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, company_name, role, is_active, can_access_designs, can_access_billing, can_access_inventory, account_status'
    )
    .eq('id', userId)
    .single()

  // Pre-migration or missing columns: don't lock anyone out.
  if (error || !profile) {
    return {
      profile: null,
      activePeriod: null,
      allowed: true,
      reason: 'no-profile',
      pendingReview: false,
    }
  }

  const typed = profile as AccessProfile

  if (isSuperadmin(typed)) {
    return { profile: typed, activePeriod: null, allowed: true, reason: 'ok', pendingReview: false }
  }

  // Self-signup awaiting review: NOT allowed into the app, but routed to the
  // pending dashboard (handled by the layout) rather than the hard-lock page.
  if (typed.account_status === 'pending_review') {
    return {
      profile: typed,
      activePeriod: null,
      allowed: false,
      reason: 'pending',
      pendingReview: true,
    }
  }

  // Signup declined.
  if (typed.account_status === 'rejected') {
    return {
      profile: typed,
      activePeriod: null,
      allowed: false,
      reason: 'rejected',
      pendingReview: false,
    }
  }

  if (typed.is_active === false) {
    return {
      profile: typed,
      activePeriod: null,
      allowed: false,
      reason: 'inactive',
      pendingReview: false,
    }
  }

  // Resolve the billing period covering today.
  const today = new Date().toISOString().slice(0, 10)
  const { data: periods } = await supabase
    .from('billing_periods')
    .select('id, plan_name, amount, starts_at, ends_at, quotation_limit, is_paid')
    .eq('user_id', userId)
    .lte('starts_at', today)
    .gte('ends_at', today)
    .order('ends_at', { ascending: false })
    .limit(1)

  const activePeriod = (periods?.[0] as BillingPeriod | undefined) ?? null

  // If the user has periods on record but none covers today, the account has
  // expired. If they have NO periods at all (e.g. legacy user), don't block —
  // the superadmin can assign one later.
  if (!activePeriod) {
    const { count } = await supabase
      .from('billing_periods')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if ((count ?? 0) > 0) {
      return {
        profile: typed,
        activePeriod: null,
        allowed: false,
        reason: 'expired',
        pendingReview: false,
      }
    }
    return { profile: typed, activePeriod: null, allowed: true, reason: 'ok', pendingReview: false }
  }

  return { profile: typed, activePeriod, allowed: true, reason: 'ok', pendingReview: false }
}

export interface QuotationUsage {
  /** NULL/unlimited when there's no active period or its limit is null. */
  limit: number | null
  used: number
  remaining: number | null
  unlimited: boolean
  /** End date of the active billing period, if any. */
  periodEnds: string | null
  /** Whether a new quotation may be created right now. */
  canCreate: boolean
}

/**
 * Quotation usage for a user against their ACTIVE billing period.
 *
 * The limit resets each billing period, so "used" counts only quotations
 * created within the active period's [starts_at, ends_at] range. With no active
 * period on record, treat as unlimited (don't block legacy users).
 */
export async function getQuotationUsage(
  supabase: Client,
  userId: string
): Promise<QuotationUsage> {
  // Superadmin is never limited.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if ((profile as { role?: string } | null)?.role === 'superadmin') {
    return { limit: null, used: 0, remaining: null, unlimited: true, periodEnds: null, canCreate: true }
  }

  const today = new Date().toISOString().slice(0, 10)
  const { data: periods } = await supabase
    .from('billing_periods')
    .select('starts_at, ends_at, quotation_limit')
    .eq('user_id', userId)
    .lte('starts_at', today)
    .gte('ends_at', today)
    .order('ends_at', { ascending: false })
    .limit(1)

  const period = periods?.[0] as
    | { starts_at: string; ends_at: string; quotation_limit: number | null }
    | undefined

  // No active period or no limit => unlimited.
  if (!period || period.quotation_limit == null) {
    return {
      limit: null,
      used: 0,
      remaining: null,
      unlimited: true,
      periodEnds: period?.ends_at ?? null,
      canCreate: true,
    }
  }

  // Count the user's quotations created within the active period.
  const { count } = await supabase
    .from('quotations')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
    .gte('created_at', period.starts_at)
    .lte('created_at', `${period.ends_at}T23:59:59.999Z`)

  const used = count ?? 0
  const limit = period.quotation_limit
  const remaining = Math.max(0, limit - used)
  return {
    limit,
    used,
    remaining,
    unlimited: false,
    periodEnds: period.ends_at,
    canCreate: used < limit,
  }
}


/**
 * Server-side action guard. Call at the top of any mutating server action a
 * regular user can trigger (create/edit quotations, designs, clients, settings)
 * to enforce that the account is fully active — NOT pending review, inactive,
 * expired, or rejected. This is the server-side lock that makes URL-based
 * bypassing impossible: even if a locked user POSTs directly, the action fails.
 *
 * Superadmin and (pre-migration) profile-less accounts pass through.
 */
export async function requireActiveAccount(
  supabase: Client,
  userId: string
): Promise<{ ok: true } | { ok: false; reason: AccessState['reason']; error: string }> {
  const access = await getAccessState(supabase, userId)
  if (access.allowed) return { ok: true }

  const messages: Record<string, string> = {
    pending: 'Your account is still under review. You can’t perform this action until it’s activated.',
    inactive: 'Your account is inactive. Contact your administrator.',
    expired: 'Your plan has expired. Renew to continue.',
    rejected: 'Your account request was declined.',
  }
  return {
    ok: false,
    reason: access.reason,
    error: messages[access.reason] ?? 'Your account cannot perform this action right now.',
  }
}
