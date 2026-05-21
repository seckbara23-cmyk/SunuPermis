'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard] Unhandled error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-red-500" />
        <div className="px-6 py-8 text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Une erreur est survenue</h2>
          <p className="text-sm text-gray-500 mb-6">
            Une erreur inattendue s&apos;est produite. Veuillez réessayer ou contacter votre administrateur.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  )
}
