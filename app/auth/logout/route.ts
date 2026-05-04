import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  })

  // Read cookies from the actual incoming request — guaranteed to match
  // exactly what the browser sent, including chunked tokens (.0, .1, …).
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      // Explicit path: '/' ensures the Set-Cookie attribute matches the
      // scope Supabase used when setting the cookie, so the browser
      // actually removes it instead of creating a scoped duplicate.
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
      })
    }
  })

  return response
}
