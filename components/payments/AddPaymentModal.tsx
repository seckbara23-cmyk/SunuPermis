'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addPayment } from '@/app/dashboard/payments/actions'
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/lib/formatters'
import type { PaymentMethod, PaymentStatus } from '@/types'

interface StudentOption {
  id: string
  full_name: string
}

interface Props {
  students: StudentOption[]
  onClose: () => void
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function AddPaymentModal({ students, onClose }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const firstRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
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
    const amount = parseFloat(data.get('amount') as string)

    if (isNaN(amount) || amount <= 0) {
      setError('Le montant doit être un nombre positif.')
      setLoading(false)
      return
    }

    const result = await addPayment({
      student_id: data.get('student_id') as string,
      amount,
      payment_method: data.get('payment_method') as PaymentMethod,
      status: data.get('status') as PaymentStatus,
      payment_date: data.get('payment_date') as string,
      notes: data.get('notes') as string,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Enregistrer un paiement</h2>
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

          <div>
            <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
              Élève <span className="text-red-500">*</span>
            </label>
            {students.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">
                Aucun élève trouvé pour cette auto-école.
              </p>
            ) : (
              <select
                ref={firstRef}
                id="student_id"
                name="student_id"
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white"
              >
                <option value="" disabled>Sélectionner un élève</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Montant (FCFA) <span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              required
              min="1"
              step="0.01"
              placeholder="Ex. 75000"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
              Méthode de paiement <span className="text-red-500">*</span>
            </label>
            <select
              id="payment_method"
              name="payment_method"
              required
              defaultValue=""
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white"
            >
              <option value="" disabled>Sélectionner</option>
              {PAYMENT_METHOD_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Statut <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              required
              defaultValue="paid"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white"
            >
              {PAYMENT_STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="payment_date"
              name="payment_date"
              type="date"
              required
              defaultValue={today()}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
              <span className="ml-1 text-xs font-normal text-gray-400">(facultatif)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Informations complémentaires..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
            />
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
              disabled={loading || students.length === 0}
              className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
