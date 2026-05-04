'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addStudent } from '@/app/dashboard/students/actions'
import type { UserRole } from '@/types'

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D']

interface DrivingSchoolOption {
  id: string
  name: string
}

interface Props {
  role: UserRole
  drivingSchools: DrivingSchoolOption[]
  onClose: () => void
}

interface Credentials {
  email: string
  password: string
}

export default function AddStudentModal({ role, drivingSchools, onClose }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copied, setCopied] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const data = new FormData(e.currentTarget)
    const email = (data.get('email') as string).trim()
    const submittedPassword = (data.get('password') as string).trim()

    const result = await addStudent({
      full_name: data.get('full_name') as string,
      phone: data.get('phone') as string,
      email,
      password: submittedPassword || undefined,
      license_category: data.get('license_category') as string,
      driving_school_id: data.get('driving_school_id') as string | undefined,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Show credentials — auto-generated password from server, or what the admin typed
    const shownPassword = result.createdPassword ?? submittedPassword
    setCredentials({ email, password: shownPassword })
    router.refresh()
    setLoading(false)
  }

  async function handleCopy() {
    if (!credentials) return
    const text = `Email : ${credentials.email}\nMot de passe : ${credentials.password}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isSuperAdmin = role === 'super_admin'

  // ── Credentials screen ────────────────────────────────────
  if (credentials) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Compte créé avec succès</h2>
              <p className="text-sm text-gray-500">Transmettez ces identifiants à l'élève</p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</span>
                <span className="text-sm font-medium text-gray-900">{credentials.email}</span>
              </div>
              <div className="border-t border-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mot de passe</span>
                <span className="text-sm font-mono font-semibold text-gray-900 tracking-widest">
                  {credentials.password}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              L'élève devra utiliser ces informations pour se connecter sur SunuPermis.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleCopy}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? '✓ Copié !' : 'Copier les identifiants'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form screen ───────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Ajouter un élève</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {isSuperAdmin && (
            <div>
              <label htmlFor="driving_school_id" className="block text-sm font-medium text-gray-700 mb-1">
                Auto-école <span className="text-red-500">*</span>
              </label>
              <select
                id="driving_school_id"
                name="driving_school_id"
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white"
              >
                <option value="" disabled>Sélectionner une auto-école</option>
                {drivingSchools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="Amadou Diallo"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="77 000 00 00"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="amadou@exemple.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe temporaire
              <span className="ml-1 text-xs font-normal text-gray-400">(auto-généré si vide)</span>
            </label>
            <input
              id="password"
              name="password"
              type="text"
              minLength={6}
              placeholder="Laisser vide pour auto-générer"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label htmlFor="license_category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie de permis <span className="text-red-500">*</span>
            </label>
            <select
              id="license_category"
              name="license_category"
              required
              defaultValue="B"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white"
            >
              {LICENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>Catégorie {cat}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
