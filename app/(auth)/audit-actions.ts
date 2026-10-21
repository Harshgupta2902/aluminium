'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

/**
 * Record a login/logout event. Called from the client auth flows after a
 * successful sign-in / before sign-out. Uses the request-scoped server client
 * so the acting user + IP are captured.
 */
export async function logAuthEvent(kind: 'login' | 'logout'): Promise<void> {
  const supabase = await createClient()
  await logAudit(supabase, { action: kind })
}

/** Record a client-triggered PDF download for a quotation. */
export async function logPdfGenerated(quotationId: string, quotationNumber?: string): Promise<void> {
  const supabase = await createClient()
  await logAudit(supabase, {
    action: 'pdf.generated',
    entityType: 'quotation',
    entityId: quotationId,
    metadata: quotationNumber ? { quotation_number: quotationNumber } : null,
  })
}
