export const NOTIFICATION_STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  queued:    'En file d\'attente',
  sending:   'Envoi en cours',
  sent:      'Envoyé',
  delivered: 'Livré',
  failed:    'Échec',
  cancelled: 'Annulé',
}

export const NOTIFICATION_STATUS_CLASS: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-600',
  queued:    'bg-blue-50 text-blue-600',
  sending:   'bg-indigo-100 text-indigo-700',
  sent:      'bg-green-100 text-green-700',
  delivered: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  email:    'Email',
  sms:      'SMS',
  whatsapp: 'WhatsApp',
  log:      'Journal',
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  booking_approved:     'Réservation approuvée',
  booking_rejected:     'Réservation rejetée',
  appointment_confirmed:'Rendez-vous confirmé',
  appointment_rejected: 'Rendez-vous rejeté',
  student_invitation:   'Invitation élève',
  payment_reminder:     'Rappel de paiement',
  payment_confirmed:    'Paiement confirmé',
}
