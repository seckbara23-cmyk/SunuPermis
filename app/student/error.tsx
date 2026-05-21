'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[student] Unhandled error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
        <div className="px-6 py-8 text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Une erreur est survenue</h2>
          <p className="text-sm text-gray-500 mb-6">
            Impossible d&apos;afficher votre tableau de bord. Veuillez réessayer.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Réessayer
            </button>
            <Link
              href="/login"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Se déconnecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
