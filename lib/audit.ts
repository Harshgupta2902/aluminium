import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

/**
 * App-level audit logging.
 *
 * Use this for events that DB triggers can't capture — login, logout,
 * email.sent, pdf.generated, signup — or where rich context (amounts, names)
 * is worth recording. Table-row mutations (quotation/design/client/invoice
 * create/update/delete) are auto-logged by DB triggers, so don't double-log
 * those here.
 *
 * Fails silently: an audit write must never break the user's actual action.
 */
export async function logAudit(
  supabase: SupabaseClient,
  event: {
    action: string
    entityType?: string | null
    entityId?: string | null
    metadata?: Record<string, unknown> | null
    /** Override the acting user (e.g. during signup before a session exists). */
    userId?: string | null
    userEmail?: string | null
  }
): Promise<void> {
  try {
    let userId = event.userId ?? null
    let userEmail = event.userEmail ?? null

    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
      userEmail = userEmail ?? user?.email ?? null
    }

    let ip: string | null = null
    try {
      const h = await headers()
      ip =
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null
    } catch {
      /* headers() unavailable outside a request scope */
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_email: userEmail,
      action: event.action,
      entity_type: event.entityType ?? null,
      entity_id: event.entityId ?? null,
      source: 'app',
      metadata: event.metadata ?? null,
      ip_address: ip,
    })
  } catch (err) {
    // Never let logging break the real operation.
    console.error('[audit] failed to write log:', err)
  }
}
