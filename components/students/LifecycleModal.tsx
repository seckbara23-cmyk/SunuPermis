'use client'

import { useState, useEffect, useRef } from 'react'

type LifecycleAction = 'suspend' | 'archive' | 'reactivate'

interface Props {
  action: LifecycleAction
  studentName: string
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}

const ACTION_META: Record<LifecycleAction, {
  title: string
  description: string
  requiresReason: boolean
  reasonLabel: string
  reasonPlaceholder: string
  confirmLabel: string
  confirmClass: string
}> = {
  suspend: {
    title:             'Suspendre le compte',
    description:       "Le compte sera bloqué immédiatement. L'élève ne pourra plus se connecter mais toutes ses données sont conservées.",
    requiresReason:    true,
    reasonLabel:       'Raison de la suspension *',
    reasonPlaceholder: "Ex : infraction au règlement, impayé, décision administrative…",
    confirmLabel:      'Confirmer la suspension',
    confirmClass:      'bg-orange-600 hover:bg-orange-700',
  },
  archive: {
    title:             'Archiver le compte',
    description:       "Le compte sera archivé. L'élève ne pourra plus se connecter. L'historique (paiements, examens, rendez-vous) est entièrement conservé.",
    requiresReason:    true,
    reasonLabel:       "Raison de l'archivage *",
    reasonPlaceholder: "Ex : fin de formation, départ, demande de l'élève…",
    confirmLabel:      "Confirmer l'archivage",
    confirmClass:      'bg-gray-700 hover:bg-gray-800',
  },
  reactivate: {
    title:             'Réactiver le compte',
    description:       "L'accès au compte sera rétabli immédiatement. L'élève pourra se reconnecter à son espace.",
    requiresReason:    false,
    reasonLabel:       '',
    reasonPlaceholder: '',
    confirmLabel:      'Confirmer la réactivation',
    confirmClass:      'bg-green-600 hover:bg-green-700',
  },
}

export default function LifecycleModal({ action, studentName, onConfirm, onClose }: Props) {
  const [reason, setReason]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const reasonRef               = useRef<HTMLTextAreaElement>(null)
  const meta                    = ACTION_META[action]

  // Focus the reason textarea on open (if needed)
  useEffect(() => {
    if (meta.requiresReason) reasonRef.current?.focus()
  }, [meta.requiresReason])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [loading, onClose])

  async function handleConfirm() {
    if (meta.requiresReason && !reason.trim()) {
      setError('Ce champ est obligatoire.')
      reasonRef.current?.focus()
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onConfirm(reason.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}>
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">{meta.title}</h2>
        <p className="text-sm text-gray-500 mb-1">
          <span className="font-medium text-gray-700">{studentName}</span>
        </p>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">{meta.description}</p>

        {meta.requiresReason && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {meta.reasonLabel}
            </label>
            <textarea
              ref={reasonRef}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(null) }}
              rows={3}
              disabled={loading}
              placeholder={meta.reasonPlaceholder}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none disabled:opacity-50"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        )}

        {!meta.requiresReason && error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${meta.confirmClass}`}
          >
            {loading ? 'En cours…' : meta.confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
