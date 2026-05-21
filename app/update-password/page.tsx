'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function SenegalFlag({ className }: { className?: string }) {
  return (
    <svg
      width="26"
      height="18"
      viewBox="0 0 3 2"
      role="img"
      aria-label="Drapeau du Sénégal"
      className={className}
    >
      <rect width="1" height="2" fill="#00853F" />
      <rect x="1" width="1" height="2" fill="#FDEF42" />
      <rect x="2" width="1" height="2" fill="#E31B23" />
      <polygon
        points="1.5,0.72 1.56,0.91 1.77,0.91 1.60,1.03 1.67,1.23 1.5,1.11 1.33,1.23 1.40,1.03 1.23,0.91 1.44,0.91"
        fill="#00853F"
      />
    </svg>
  )
}

export default function UpdatePasswordPage() {
  const router = useRouter()

  const [ready, setReady]       = useState(false)
  const [noSession, setNoSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) setNoSession(true)
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Impossible de mettre à jour le mot de passe. Veuillez recommencer depuis le lien reçu par email.')
      setLoading(false)
      return
    }

    // Sign out all sessions — user must log in fresh with the new password.
    await supabase.auth.signOut({ scope: 'global' })
    setDone(true)

    setTimeout(() => router.push('/login'), 3000)
  }

  const pageContent = () => {
    if (!ready) {
      return (
        <div className="flex items-center justify-center py-8">
          <svg className="w-6 h-6 animate-spin text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      )
    }

    if (noSession) {
      return (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Lien expiré ou invalide</p>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Ce lien de réinitialisation n&apos;est plus valide. Les liens expirent après 1 heure.
            </p>
          </div>
          <Link
            href="/reset-password"
            className="inline-block mt-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            Demander un nouveau lien
          </Link>
        </div>
      )
    }

    if (done) {
      return (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Mot de passe mis à jour</p>
            <p className="mt-2 text-sm text-gray-500">
              Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion…
            </p>
          </div>
        </div>
      )
    }

    return (
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <p className="text-sm text-gray-600">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            placeholder="Minimum 8 caractères"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            placeholder="Répétez le mot de passe"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
        </button>
      </form>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="h-1 shrink-0 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />

            <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-navy text-lg font-bold select-none">SP</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold text-navy">SunuPermis</h1>
                <SenegalFlag className="rounded-[2px] shadow-sm shrink-0" />
              </div>
              <p className="mt-1.5 text-sm text-gray-500">Nouveau mot de passe</p>
            </div>

            <div className="px-8 py-7">
              {pageContent()}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} SunuPermis · Gestion du permis de conduire
          </p>
        </div>
      </main>
    </div>
  )
}
