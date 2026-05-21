// ── Manual payment statuses (school-admin recorded) ────────────────────────────
// These reflect the school's view of the student's payment obligation.

// ── Gateway payment statuses (provider lifecycle) ──────────────────────────────
// These reflect the payment provider's transaction lifecycle (Wave, Orange Money).

export type PaymentGatewayStatus =
  | 'initiated'   // Payment initiated with provider
  | 'processing'  // Provider is processing the transaction
  | 'succeeded'   // Provider confirmed successful payment
  | 'failed'      // Provider reported failure
  | 'expired'     // Payment link/session timed out
  | 'refunded'    // Payment reversed
  | 'cancelled'   // Cancelled before completion

interface StatusConfig {
  label: string
  className: string
  isTerminal?: boolean
}

export const PAYMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  // Manual statuses
  pending:    { label: 'En attente',     className: 'bg-amber-100 text-amber-700' },
  partial:    { label: 'Partiel',        className: 'bg-blue-100 text-blue-700' },
  paid:       { label: 'Payé',           className: 'bg-green-100 text-green-700',   isTerminal: true },
  overdue:    { label: 'En retard',      className: 'bg-red-100 text-red-700' },
  // Gateway statuses
  initiated:  { label: 'Initié',         className: 'bg-indigo-100 text-indigo-700' },
  processing: { label: 'En traitement',  className: 'bg-indigo-100 text-indigo-700' },
  succeeded:  { label: 'Réussi',         className: 'bg-green-100 text-green-700',   isTerminal: true },
  failed:     { label: 'Échec',          className: 'bg-red-100 text-red-700',        isTerminal: true },
  expired:    { label: 'Expiré',         className: 'bg-gray-100 text-gray-500',      isTerminal: true },
  refunded:   { label: 'Remboursé',      className: 'bg-purple-100 text-purple-700',  isTerminal: true },
  cancelled:  { label: 'Annulé',         className: 'bg-gray-100 text-gray-500',      isTerminal: true },
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:          'Espèces',
  wave:          'Wave',
  orange_money:  'Orange Money',
  bank_transfer: 'Virement bancaire',
}

export function getPaymentStatusConfig(status: string): StatusConfig {
  return PAYMENT_STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
}
