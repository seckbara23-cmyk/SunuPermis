import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  })

  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
      })
    }
  })

  return response
}
