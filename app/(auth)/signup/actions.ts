'use server'

import { z } from 'zod'
import { createIsolatedClient } from '@/lib/supabase/isolated'
import { logAudit } from '@/lib/audit'

/* ------------------------------------------------------------------ *
 * Public self-service signup
 * ------------------------------------------------------------------ *
 * A visitor registers and picks a plan. We:
 *   1. Create their auth account via an isolated (sessionless) client, tagging
 *      the metadata with account_status = 'pending_review' so the
 *      handle_new_user trigger starts the profile locked.
 *   2. Sign them in on that same isolated client purely to obtain a session
 *      whose auth.uid() = the new user — this lets the leads_insert RLS policy
 *      (user_id = auth.uid()) accept the lead row.
 *
 * The user is NOT logged into the browser here (isolated client writes no
 * cookies). They log in afterwards via /login and land on the pending
 * dashboard until the superadmin processes their lead.
 * ------------------------------------------------------------------ */

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(72),
  companyName: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  planId: z.string().uuid('Please select a plan.'),
})

export type SignupInput = z.infer<typeof signupSchema>

export async function signUpWithPlan(input: SignupInput) {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }
  const d = parsed.data
  const email = d.email.toLowerCase()

  const supabase = createIsolatedClient()

  // Validate the selected plan is real, active and public (RLS already limits
  // the anon-readable set to active+public plans, so a bad id returns null).
  const { data: plan } = await supabase
    .from('plans')
    .select('id, name')
    .eq('id', d.planId)
    .single()

  if (!plan) {
    return { success: false as const, error: 'That plan is no longer available. Please pick another.' }
  }

  // 1) Create the auth account, locked for review.
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password: d.password,
    options: {
      data: {
        full_name: d.fullName,
        company_name: d.companyName ?? '',
        phone: d.phone ?? '',
        role: 'user',
        account_status: 'pending_review',
      },
    },
  })

  if (signUpError || !signUp.user) {
    const msg = signUpError?.message ?? 'Could not create your account.'
    const friendly = /already registered|already exists|duplicate/i.test(msg)
      ? 'An account with this email already exists. Try logging in instead.'
      : msg
    return { success: false as const, error: friendly }
  }

  const newUserId = signUp.user.id

  // 2) Obtain a session for the new user on the isolated client so the
  //    leads_insert RLS check (user_id = auth.uid()) passes. If email
  //    confirmation is required, signInWithPassword may fail — in that case we
  //    still created the account; the lead can be reconciled by the admin from
  //    the user record, so we don't hard-fail signup.
  let leadInserted = false
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: d.password,
  })

  if (!signInError) {
    const { error: leadError } = await supabase.from('leads').insert({
      user_id: newUserId,
      full_name: d.fullName,
      email,
      phone: d.phone ?? null,
      company_name: d.companyName ?? null,
      plan_id: plan.id,
      plan_name: plan.name,
      status: 'new',
    })
    leadInserted = !leadError
    if (leadError) {
      console.error('[signUpWithPlan] lead insert failed:', leadError.message)
    }
    // Audit the signup while we still hold the new user's session.
    await logAudit(supabase, {
      action: 'signup',
      entityType: 'user',
      entityId: newUserId,
      userId: newUserId,
      userEmail: email,
      metadata: { plan: plan.name },
    })
    // Drop the isolated session — never persisted to cookies anyway.
    await supabase.auth.signOut()
  } else {
    console.error('[signUpWithPlan] post-signup sign-in failed:', signInError.message)
  }

  return {
    success: true as const,
    planName: plan.name,
    leadInserted,
  }
}
