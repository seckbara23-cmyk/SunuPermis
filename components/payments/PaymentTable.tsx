'use client'

import type { PaymentWithStudent } from '@/types'
import { PaymentStatusBadge } from '@/components/ui/StatusBadge'
import { PAYMENT_METHOD_CONFIG } from '@/lib/formatters'

interface Props {
  payments: PaymentWithStudent[]
}

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

export default function PaymentTable({ payments }: Props) {
  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-16 text-center">
        <p className="text-gray-500 text-sm font-medium">Aucun paiement enregistré.</p>
        <p className="text-gray-400 text-xs mt-2">
          Les transactions apparaîtront ici dès qu&apos;un paiement sera enregistré.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50">
            {['Élève', 'Montant', 'Méthode', 'Statut', 'Date', 'Notes'].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                {payment.students.full_name}
              </td>
              <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                {formatFCFA(Number(payment.amount))}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                {PAYMENT_METHOD_CONFIG[payment.payment_method]?.label ?? payment.payment_method}
              </td>
              <td className="px-5 py-4">
                <PaymentStatusBadge status={payment.status} />
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                {new Date(payment.payment_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-5 py-4 text-sm text-gray-400 max-w-xs truncate">
                {payment.notes ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
