'use client'

import { useState } from 'react'
import type { PaymentWithStudent } from '@/types'
import PaymentTable from './PaymentTable'
import AddPaymentModal from './AddPaymentModal'

interface StudentOption {
  id: string
  full_name: string
}

interface Props {
  payments: PaymentWithStudent[]
  students: StudentOption[]
  canAdd: boolean
}

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

export default function PaymentsClient({ payments, students, canAdd }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const pending = payments.filter((p) => p.status === 'pending' || p.status === 'overdue').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {payments.length} transaction{payments.length !== 1 ? 's' : ''}
            {pending > 0 && (
              <span className="text-red-600"> — {pending} en attente ou en retard</span>
            )}
            {totalPaid > 0 && (
              <span className="text-gray-400"> · {formatFCFA(totalPaid)} encaissés</span>
            )}
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            + Enregistrer un paiement
          </button>
        )}
      </div>

      <PaymentTable payments={payments} />

      {modalOpen && (
        <AddPaymentModal
          students={students}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
