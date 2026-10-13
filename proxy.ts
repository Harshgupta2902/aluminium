import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16: the former `middleware.ts` convention is renamed to `proxy.ts`.
// The function is exported as `proxy`.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies onto the request so downstream reads see them...
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // ...then recreate the response and copy cookies (with options)
          // onto it so the Set-Cookie headers reach the browser.
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and getUser().
  // getUser() refreshes the auth token and triggers setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect dashboard + design routes.
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/design'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Resolve the role once for any authenticated app request so we can route
  // the superadmin to their dedicated console and keep users out of /admin.
  let role: string | null = null
  if (
    user &&
    (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/design') ||
      pathname === '/login' ||
      pathname === '/signup')
  ) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? null
  }
  const isSuper = role === 'superadmin'

  const toAdmin = () => {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/admin'
    return NextResponse.redirect(url)
  }
  const toDashboard = () => {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user) {
    const inAdminArea = pathname.startsWith('/dashboard/admin')

    // Non-superadmin trying to reach the admin console → user dashboard.
    if (inAdminArea && !isSuper) return toDashboard()

    // Superadmin anywhere in the user-facing app (dashboard non-admin, or the
    // design editor) → their admin console. The superadmin has no use for the
    // quotation/design tooling.
    if (
      isSuper &&
      ((pathname.startsWith('/dashboard') && !inAdminArea) ||
        pathname.startsWith('/design'))
    ) {
      return toAdmin()
    }
  }

  // Public signup is disabled — route it to login (or the right home).
  if (pathname === '/signup') {
    if (user) return isSuper ? toAdmin() : toDashboard()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from the login page.
  if (user && pathname === '/login') {
    return isSuper ? toAdmin() : toDashboard()
  }

  // IMPORTANT: return the supabaseResponse so refreshed auth cookies persist.
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
