'use client'

import { useUser } from '@/hooks/useUser'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  school_admin: 'Admin École',
  instructor: 'Moniteur',
  student: 'Élève',
}

export default function Header() {
  const { profile } = useUser()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Left — reserved for future breadcrumb */}
      <div />

      {/* Right — user info + logout */}
      <div className="flex items-center gap-4">
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

        {/* Plain HTML POST — browser delivers Set-Cookie from the 303 response
            before following the redirect, guaranteeing cookies are cleared. */}
        <form method="POST" action="/api/auth/logout">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
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
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  )
}
