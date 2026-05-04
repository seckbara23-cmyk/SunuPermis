'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // signOut() only removes the base cookie key. Supabase chunks large tokens
  // across sb-*-auth-token.0, .1, … cookies. Explicitly delete every matching
  // cookie so no chunk survives and the middleware cannot reassemble a session.
  const cookieStore = await cookies()
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
      cookieStore.delete(cookie.name)
    }
  })

  redirect('/login')
}
