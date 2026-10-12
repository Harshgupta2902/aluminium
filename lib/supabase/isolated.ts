import 'server-only'

import { createServerClient } from '@supabase/ssr'

/**
 * A Supabase client that uses the anon key but does NOT read or write the
 * request's auth cookies. Use this for server-side auth operations that must
 * not affect the current signed-in user — e.g. an admin calling `auth.signUp`
 * to create ANOTHER user's account (without getting logged out / swapped).
 *
 * It behaves exactly like a fresh, sessionless browser client would: `signUp`
 * goes through GoTrue (password hashed + confirmation handled by Supabase,
 * identical to normal registration), but the resulting session is discarded.
 */
export function createIsolatedClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Intentionally a no-op: never persist this session to the admin's cookies.
        },
      },
    }
  )
}
