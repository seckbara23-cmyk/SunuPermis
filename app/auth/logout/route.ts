import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Build the redirect response first so we can mutate its Set-Cookie headers.
  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  })

  // Explicitly expire every Supabase auth cookie — including chunked tokens
  // (sb-*-auth-token.0, .1, …) that signOut() alone does not remove.
  const cookieStore = await cookies()
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
      response.cookies.delete(cookie.name)
    }
  })

  return response
}
