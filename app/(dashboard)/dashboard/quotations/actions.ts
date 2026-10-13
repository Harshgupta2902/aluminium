'use server'

import { createClient } from '@/lib/supabase/server'
import { getQuotationUsage, type QuotationUsage } from '@/lib/access'

/**
 * Server-side quotation-limit check. The new-quotation page calls this before
 * creating its first draft so a user can't exceed the limit on their active
 * billing period (client-side counting could be bypassed; RLS also hides other
 * users' rows, so a client count would be wrong for the superadmin anyway).
 */
export async function getMyQuotationUsage(): Promise<QuotationUsage> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      limit: 0,
      used: 0,
      remaining: 0,
      unlimited: false,
      periodEnds: null,
      canCreate: false,
    }
  }
  return getQuotationUsage(supabase, user.id)
}
