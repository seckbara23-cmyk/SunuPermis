import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function roleToHome(role: string | undefined | null): string {
  if (role === 'super_admin')  return '/admin'
  if (role === 'school_admin') return '/dashboard'
  return '/student'
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginRoute   = pathname.startsWith('/login')
  const isRootRoute    = pathname === '/'
  const isAdminRoute   = pathname.startsWith('/admin')
  const isDashRoute    = pathname.startsWith('/dashboard')
  const isStudentRoute = pathname.startsWith('/student')

  const isProtected = isAdminRoute || isDashRoute || isStudentRoute

  // Unauthenticated → login
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated on /login or / → fetch role and redirect to correct home
  if (user && (isLoginRoute || isRootRoute)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = roleToHome(profile?.role)
    return NextResponse.redirect(url)
  }

  supabaseResponse.headers.set('Cache-Control', 'no-store')
  return supabaseResponse
}
