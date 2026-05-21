'use client'

import { useState } from 'react'
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

interface Props {
  urlError?: string
}

export default function ResetPasswordClient({ urlError }: Props) {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const origin   = window.location.origin

    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/callback?next=/update-password`,
    })

    // Always show success — never reveal whether the email exists.
    setSent(true)
    setLoading(false)
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
              <p className="mt-1.5 text-sm text-gray-500">Réinitialisation du mot de passe</p>
            </div>

            <div className="px-8 py-7">
              {urlError === 'lien-invalide' && !sent && (
                <div
                  role="alert"
                  className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3"
                >
                  Le lien de réinitialisation est invalide ou a expiré. Veuillez recommencer.
                </div>
              )}

              {sent ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email envoyé</p>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                      Si un compte est associé à <span className="font-medium text-gray-700">{email}</span>,
                      vous recevrez un email avec les instructions de réinitialisation dans quelques minutes.
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Vérifiez également vos courriers indésirables.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="inline-block mt-2 text-sm font-medium text-navy hover:underline"
                  >
                    Retour à la connexion
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>

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

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && (
                      <svg className="w-4 h-4 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
                  </button>

                  <p className="text-center">
                    <Link href="/login" className="text-sm text-gray-500 hover:text-navy transition-colors">
                      ← Retour à la connexion
                    </Link>
                  </p>
                </form>
              )}
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
