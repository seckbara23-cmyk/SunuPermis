'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/services/auth'
import { createClient } from '@/lib/supabase/client'

// ── Space definitions ──────────────────────────────────────────────────────────

type Space = 'admin' | 'school' | 'student'

const SPACES: {
  id: Space
  label: string
  description: string
}[] = [
  {
    id: 'admin',
    label: 'Administration',
    description: 'Supervision des auto-écoles, validations et gestion nationale.',
  },
  {
    id: 'school',
    label: 'Auto-école',
    description: 'Gestion des élèves, dossiers, documents et rendez-vous.',
  },
  {
    id: 'student',
    label: 'Élève',
    description: 'Suivi du dossier, documents, paiements et rendez-vous.',
  },
]

// Roles that are authorised to enter each space.
// instructor is intentionally excluded from 'school' until a dedicated
// instructor dashboard exists — the layout currently rejects that role.
const ALLOWED_ROLES: Record<Space, string[]> = {
  admin:   ['super_admin'],
  school:  ['school_admin'],
  student: ['student'],
}

const REDIRECT: Record<Space, string> = {
  admin:   '/admin',
  school:  '/dashboard',
  student: '/student',
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function LoginForm() {
  const router = useRouter()
  const [space, setSpace]       = useState<Space>('admin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const activeSpace = SPACES.find((s) => s.id === space)!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 1. Authenticate with Supabase
    const { data, error: signInError } = await signIn(email, password)
    if (signInError || !data?.user) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    // 2. Fetch the user's role from the profiles table
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    const role = profile?.role
    if (!role) {
      await supabase.auth.signOut()
      setError("Profil introuvable. Contactez l'administrateur.")
      setLoading(false)
      return
    }

    // 3. Verify the role is allowed in the selected space.
    //    If not, sign out immediately so no session is retained.
    if (!ALLOWED_ROLES[space].includes(role)) {
      await supabase.auth.signOut()
      setError("Ce compte n'a pas accès à cet espace.")
      setLoading(false)
      return
    }

    // 4. Redirect to the matching dashboard.
    //    router.refresh() invalidates the RSC cache so server layouts
    //    pick up the newly-set session cookie on the next render.
    router.push(REDIRECT[space])
    router.refresh()
    // keep loading=true while navigation is in flight
  }

  function handleTabChange(id: Space) {
    setSpace(id)
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* ── Segmented tab control ──────────────────────────────────── */}
      <div
        className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 mb-4"
        role="tablist"
        aria-label="Sélectionner un espace"
      >
        {SPACES.map((s) => {
          const isActive = space === s.id
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(s.id)}
              className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
                isActive
                  ? 'bg-white text-navy shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* ── Space description ──────────────────────────────────────── */}
      <p
        key={space}
        className="text-xs text-center text-gray-500 mb-6 min-h-[2.5rem] px-2 leading-relaxed"
      >
        {activeSpace.description}
      </p>

      {/* ── Error banner ───────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3"
        >
          {error}
        </div>
      )}

      {/* ── Fields ─────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            placeholder="vous@exemple.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* ── Submit ─────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading && (
          <svg
            className="w-4 h-4 animate-spin shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
