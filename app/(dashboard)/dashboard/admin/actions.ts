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
