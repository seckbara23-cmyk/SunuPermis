'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  school_admin: 'Admin École',
  instructor: 'Moniteur',
  student: 'Élève',
}

export default function Header() {
  const { profile } = useUser()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  async function handleSignOut() {
    setSigningOut(true)
    setSignOutError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Erreur lors de la déconnexion :', error.message)
      setSignOutError('Erreur lors de la déconnexion. Veuillez réessayer.')
      setSigningOut(false)
      return
    }

    router.refresh()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Left — reserved for future breadcrumb */}
      <div />

      {/* Right — user info + logout (logout always visible) */}
      <div className="flex items-center gap-4">
        {signOutError && (
          <p className="text-xs text-red-600">{signOutError}</p>
        )}

        {profile && (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy text-sm font-bold shrink-0">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm leading-tight">
                <p className="font-medium text-gray-900">{profile.full_name}</p>
                <p className="text-gray-400 text-xs">
                  {ROLE_LABEL[profile.role] ?? profile.role}
                </p>
              </div>
            </div>
            <div className="w-px h-6 bg-gray-200" />
          </>
        )}

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {signingOut ? 'Déconnexion...' : 'Déconnexion'}
        </button>
      </div>
    </header>
  )
}
