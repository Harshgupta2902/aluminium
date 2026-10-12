import { createClient } from "@supabase/supabase-js"

/** Read-only client for sitemap/build jobs (no cookies). Respects RLS. */
export function createSupabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required")
  }
  return createClient(url, key)
}
