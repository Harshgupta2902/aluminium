'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createIsolatedClient } from '@/lib/supabase/isolated'
import { sendUserCredentialsEmail } from '@/lib/mailer'

/* ------------------------------------------------------------------ *
 * Guard
 * ------------------------------------------------------------------ */

async function requireSuperadmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    return { ok: false, error: 'Superadmin access is required.' }
  }
  return { ok: true, userId: user.id }
}

function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? 'Invalid input.'
}

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export interface AdminUserRow {
  id: string
  email: string
  full_name: string
  company_name: string | null
  phone: string | null
  role: string
  is_active: boolean
  can_access_designs: boolean
  can_access_billing: boolean
  can_access_inventory: boolean
  created_at: string
  // Active billing period (if any).
  plan_name: string | null
  period_ends: string | null
  quotation_limit: number | null
  is_paid: boolean | null
  // Usage within the active period.
  quotations_used: number
}

/* ------------------------------------------------------------------ *
 * Create user
 * ------------------------------------------------------------------ */

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(72),
  companyName: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  canAccessDesigns: z.boolean().default(true),
  canAccessBilling: z.boolean().default(true),
  canAccessInventory: z.boolean().default(true),
  // Billing period.
  planName: z.string().trim().min(1, 'Plan name is required.').default('Standard'),
  amount: z.number().min(0).default(0),
  quotationLimit: z.number().int().min(0).nullable().default(null),
  startsAt: z.string().min(1, 'Start date is required.'),
  endsAt: z.string().min(1, 'End date is required.'),
  isPaid: z.boolean().default(false),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export async function createUserAccount(input: CreateUserInput) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: firstError(parsed.error) }
  const d = parsed.data
  const email = d.email.toLowerCase()

  // 1) Create the auth identity via an isolated (sessionless) client so the
  //    superadmin's own session is never swapped. The on_auth_user_created
  //    trigger creates the profile row from this metadata.
  const isolated = createIsolatedClient()
  const { data: signUp, error: signUpError } = await isolated.auth.signUp({
    email,
    password: d.password,
    options: {
      data: { full_name: d.fullName, company_name: d.companyName ?? '', role: 'user' },
    },
  })

  if (signUpError || !signUp.user) {
    const msg = signUpError?.message ?? 'Could not create the account.'
    const friendly = /already registered|already exists|duplicate/i.test(msg)
      ? 'An account with this email already exists.'
      : msg
    return { success: false as const, error: friendly }
  }

  const newUserId = signUp.user.id
  const supabase = await createClient()

  // 2) Fill in the profile fields the trigger didn't set (superadmin RLS allows this).
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: d.fullName,
      company_name: d.companyName ?? null,
      phone: d.phone ?? null,
      role: 'user',
      is_active: true,
      can_access_designs: d.canAccessDesigns,
      can_access_billing: d.canAccessBilling,
      can_access_inventory: d.canAccessInventory,
      updated_at: new Date().toISOString(),
    })
    .eq('id', newUserId)
  if (profileError) {
    return {
      success: false as const,
      error: `Account created but profile could not be saved: ${profileError.message}`,
    }
  }

  // 3) Create the first billing period.
  const { error: periodError } = await supabase.from('billing_periods').insert({
    user_id: newUserId,
    plan_name: d.planName,
    amount: d.amount,
    starts_at: d.startsAt,
    ends_at: d.endsAt,
    quotation_limit: d.quotationLimit,
    is_paid: d.isPaid,
    created_by: auth.userId,
  })
  if (periodError) {
    return {
      success: false as const,
      error: `Account created but billing period could not be saved: ${periodError.message}`,
    }
  }

  // 4) Email the credentials (non-fatal).
  let emailSent = true
  try {
    await sendUserCredentialsEmail({
      email,
      recipientName: d.fullName,
      temporaryPassword: d.password,
    })
  } catch (e) {
    emailSent = false
    console.error('[createUserAccount] credentials email failed:', e)
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/users')
  return {
    success: true as const,
    userId: newUserId,
    emailSent,
    warning: emailSent
      ? undefined
      : 'Account created, but the credentials email could not be sent. Share the login details manually.',
  }
}

/* ------------------------------------------------------------------ *
 * Update user (profile flags / role / active)
 * ------------------------------------------------------------------ */

const updateUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(2).optional(),
  companyName: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
  canAccessDesigns: z.boolean().optional(),
  canAccessBilling: z.boolean().optional(),
  canAccessInventory: z.boolean().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export async function updateUserAccount(input: UpdateUserInput) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: firstError(parsed.error) }
  const d = parsed.data

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (d.fullName !== undefined) patch.full_name = d.fullName
  if (d.companyName !== undefined) patch.company_name = d.companyName
  if (d.phone !== undefined) patch.phone = d.phone
  if (d.isActive !== undefined) patch.is_active = d.isActive
  if (d.canAccessDesigns !== undefined) patch.can_access_designs = d.canAccessDesigns
  if (d.canAccessBilling !== undefined) patch.can_access_billing = d.canAccessBilling
  if (d.canAccessInventory !== undefined) patch.can_access_inventory = d.canAccessInventory

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(patch).eq('id', d.id)
  if (error) return { success: false as const, error: error.message }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/users')
  revalidatePath(`/dashboard/admin/users/${d.id}`)
  return { success: true as const }
}

export async function setUserActive(id: string, isActive: boolean) {
  return updateUserAccount({ id, isActive })
}

/* ------------------------------------------------------------------ *
 * Billing periods
 * ------------------------------------------------------------------ */

const billingPeriodSchema = z.object({
  userId: z.string().uuid(),
  planName: z.string().trim().min(1, 'Plan name is required.'),
  amount: z.number().min(0),
  quotationLimit: z.number().int().min(0).nullable(),
  startsAt: z.string().min(1, 'Start date is required.'),
  endsAt: z.string().min(1, 'End date is required.'),
  isPaid: z.boolean().default(false),
  notes: z.string().trim().optional().nullable(),
})

export type BillingPeriodInput = z.infer<typeof billingPeriodSchema>

export async function addBillingPeriod(input: BillingPeriodInput) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const parsed = billingPeriodSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: firstError(parsed.error) }
  const d = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.from('billing_periods').insert({
    user_id: d.userId,
    plan_name: d.planName,
    amount: d.amount,
    quotation_limit: d.quotationLimit,
    starts_at: d.startsAt,
    ends_at: d.endsAt,
    is_paid: d.isPaid,
    notes: d.notes ?? null,
    created_by: auth.userId,
  })
  if (error) return { success: false as const, error: error.message }

  revalidatePath(`/dashboard/admin/users/${d.userId}`)
  revalidatePath('/dashboard/admin')
  return { success: true as const }
}

export async function setBillingPaid(periodId: string, userId: string, isPaid: boolean) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('billing_periods')
    .update({ is_paid: isPaid, updated_at: new Date().toISOString() })
    .eq('id', periodId)
  if (error) return { success: false as const, error: error.message }

  revalidatePath(`/dashboard/admin/users/${userId}`)
  return { success: true as const }
}


/* ------------------------------------------------------------------ *
 * Plans (catalog CRUD)
 * ------------------------------------------------------------------ */

export interface PlanRow {
  id: string
  name: string
  description: string | null
  price: number
  billing_interval: 'monthly' | 'quarterly' | 'yearly'
  quotation_limit: number | null
  can_access_designs: boolean
  can_access_billing: boolean
  can_access_inventory: boolean
  is_active: boolean
  is_public: boolean
  sort_order: number
  created_at: string
}

const planSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Plan name is required.'),
  description: z.string().trim().optional().nullable(),
  price: z.number().min(0, 'Price cannot be negative.'),
  billingInterval: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
  quotationLimit: z.number().int().min(0).nullable().default(null),
  canAccessDesigns: z.boolean().default(true),
  canAccessBilling: z.boolean().default(true),
  canAccessInventory: z.boolean().default(true),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export type PlanInput = z.infer<typeof planSchema>

export async function savePlan(input: PlanInput) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const parsed = planSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: firstError(parsed.error) }
  const d = parsed.data

  const supabase = await createClient()
  const row = {
    name: d.name,
    description: d.description ?? null,
    price: d.price,
    billing_interval: d.billingInterval,
    quotation_limit: d.quotationLimit,
    can_access_designs: d.canAccessDesigns,
    can_access_billing: d.canAccessBilling,
    can_access_inventory: d.canAccessInventory,
    is_active: d.isActive,
    is_public: d.isPublic,
    sort_order: d.sortOrder,
    updated_at: new Date().toISOString(),
  }

  const { error } = d.id
    ? await supabase.from('plans').update(row).eq('id', d.id)
    : await supabase.from('plans').insert({ ...row, created_by: auth.userId })

  if (error) return { success: false as const, error: error.message }

  revalidatePath('/dashboard/admin/plans')
  return { success: true as const }
}

export async function setPlanActive(id: string, isActive: boolean) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('plans')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false as const, error: error.message }

  revalidatePath('/dashboard/admin/plans')
  return { success: true as const }
}

export async function deletePlan(id: string) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) return { success: false as const, error: error.message }

  revalidatePath('/dashboard/admin/plans')
  return { success: true as const }
}

/* ------------------------------------------------------------------ *
 * Leads (manual onboarding pipeline)
 * ------------------------------------------------------------------ */

const leadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'billing_sent', 'won', 'rejected']),
  notes: z.string().trim().optional().nullable(),
})

export async function updateLead(input: z.infer<typeof leadStatusSchema>) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const parsed = leadStatusSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: firstError(parsed.error) }
  const d = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from('leads')
    .update({ status: d.status, notes: d.notes ?? null, updated_at: new Date().toISOString() })
    .eq('id', d.id)
  if (error) return { success: false as const, error: error.message }

  revalidatePath('/dashboard/admin/leads')
  revalidatePath(`/dashboard/admin/leads/${d.id}`)
  return { success: true as const }
}

/**
 * Generate a billing period for a lead from its chosen plan, mark the lead
 * 'billing_sent', and (optionally) email the user. Does NOT activate the
 * account yet — activation happens when the superadmin marks the billing PAID
 * (see markLeadPaid). The period dates run from today for the plan's interval.
 */
const generateBillingSchema = z.object({
  leadId: z.string().uuid(),
  amount: z.number().min(0),
  quotationLimit: z.number().int().min(0).nullable(),
  startsAt: z.string().min(1, 'Start date is required.'),
  endsAt: z.string().min(1, 'End date is required.'),
  planName: z.string().trim().min(1),
})

export async function generateLeadBilling(input: z.infer<typeof generateBillingSchema>) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const parsed = generateBillingSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: firstError(parsed.error) }
  const d = parsed.data

  const supabase = await createClient()

  // Fetch the lead + its user.
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('id, user_id, email, full_name, status')
    .eq('id', d.leadId)
    .single()
  if (leadErr || !lead) return { success: false as const, error: 'Lead not found.' }
  if (!lead.user_id) {
    return { success: false as const, error: 'This lead has no linked account.' }
  }

  // Create the billing period (unpaid).
  const { data: period, error: periodErr } = await supabase
    .from('billing_periods')
    .insert({
      user_id: lead.user_id,
      plan_name: d.planName,
      amount: d.amount,
      quotation_limit: d.quotationLimit,
      starts_at: d.startsAt,
      ends_at: d.endsAt,
      is_paid: false,
      created_by: auth.userId,
    })
    .select('id')
    .single()
  if (periodErr || !period) {
    return { success: false as const, error: periodErr?.message ?? 'Could not create billing.' }
  }

  // Link the period to the lead + advance its status.
  await supabase
    .from('leads')
    .update({
      billing_period_id: period.id,
      status: 'billing_sent',
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id)

  revalidatePath('/dashboard/admin/leads')
  revalidatePath(`/dashboard/admin/leads/${lead.id}`)
  revalidatePath('/dashboard/admin')
  return { success: true as const, billingPeriodId: period.id }
}

/**
 * Mark a lead's billing as PAID. This is the activation switch: the billing
 * period flips to paid, the lead becomes 'won', and the user's
 * account_status -> 'active' so their dashboard unlocks.
 */
export async function markLeadPaid(leadId: string) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const supabase = await createClient()

  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('id, user_id, billing_period_id')
    .eq('id', leadId)
    .single()
  if (leadErr || !lead) return { success: false as const, error: 'Lead not found.' }
  if (!lead.user_id) return { success: false as const, error: 'This lead has no linked account.' }
  if (!lead.billing_period_id) {
    return { success: false as const, error: 'Generate billing for this lead first.' }
  }

  // 1) Mark the billing period paid.
  const { error: payErr } = await supabase
    .from('billing_periods')
    .update({ is_paid: true, updated_at: new Date().toISOString() })
    .eq('id', lead.billing_period_id)
  if (payErr) return { success: false as const, error: payErr.message }

  // 2) Activate the account.
  const { error: actErr } = await supabase
    .from('profiles')
    .update({ account_status: 'active', is_active: true, updated_at: new Date().toISOString() })
    .eq('id', lead.user_id)
  if (actErr) return { success: false as const, error: actErr.message }

  // 3) Mark the lead won.
  await supabase
    .from('leads')
    .update({ status: 'won', updated_at: new Date().toISOString() })
    .eq('id', lead.id)

  revalidatePath('/dashboard/admin/leads')
  revalidatePath(`/dashboard/admin/leads/${lead.id}`)
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/users')
  return { success: true as const }
}

/**
 * Reject a lead's signup. Marks the lead 'rejected' and sets the account
 * account_status -> 'rejected' (hard lockout).
 */
export async function rejectLead(leadId: string) {
  const auth = await requireSuperadmin()
  if (!auth.ok) return { success: false as const, error: auth.error }

  const supabase = await createClient()
  const { data: lead } = await supabase
    .from('leads')
    .select('id, user_id')
    .eq('id', leadId)
    .single()
  if (!lead) return { success: false as const, error: 'Lead not found.' }

  if (lead.user_id) {
    await supabase
      .from('profiles')
      .update({ account_status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', lead.user_id)
  }
  await supabase
    .from('leads')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', lead.id)

  revalidatePath('/dashboard/admin/leads')
  revalidatePath(`/dashboard/admin/leads/${lead.id}`)
  return { success: true as const }
}
