import type { TrainingStatus, PaymentStatus, PaymentMethod, InstructorStatus, LessonStatus, ApprovalStatus, AppointmentStatus } from '@/types'

export interface StatusConfig {
  label: string
  className: string
}

export const TRAINING_STATUS_CONFIG: Record<TrainingStatus, StatusConfig> = {
  registered:     { label: 'Inscrit',             className: 'bg-gray-100 text-gray-600' },
  in_training:    { label: 'En formation',        className: 'bg-indigo-100 text-indigo-700' },
  ready_for_exam: { label: "Prêt pour l'examen", className: 'bg-amber-100 text-amber-700' },
  completed:      { label: 'Terminé',             className: 'bg-green-100 text-green-700' },
  inactive:       { label: 'Inactif',             className: 'bg-red-100 text-red-700' },
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
  partial: { label: 'Partiel',    className: 'bg-orange-100 text-orange-700' },
  paid:    { label: 'Payé',       className: 'bg-green-100 text-green-700' },
  overdue: { label: 'En retard',  className: 'bg-red-100 text-red-700' },
}

export const INSTRUCTOR_STATUS_CONFIG: Record<InstructorStatus, StatusConfig> = {
  active:   { label: 'Actif',   className: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-600' },
}

export function trainingStatusLabel(status: TrainingStatus): string {
  return TRAINING_STATUS_CONFIG[status].label
}

export function paymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_CONFIG[status].label
}

export function instructorStatusLabel(status: InstructorStatus): string {
  return INSTRUCTOR_STATUS_CONFIG[status].label
}

// Ordered option lists for <select> dropdowns
export const TRAINING_STATUS_OPTIONS = (
  Object.entries(TRAINING_STATUS_CONFIG) as [TrainingStatus, StatusConfig][]
).map(([value, { label }]) => ({ value, label }))

export const LESSON_STATUS_CONFIG: Record<LessonStatus, StatusConfig> = {
  scheduled: { label: 'Planifiée', className: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Terminée',  className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée',   className: 'bg-gray-100 text-gray-600' },
  missed:    { label: 'Manquée',   className: 'bg-red-100 text-red-700' },
}

export function lessonStatusLabel(status: LessonStatus): string {
  return LESSON_STATUS_CONFIG[status].label
}

export const LESSON_STATUS_OPTIONS = (
  Object.entries(LESSON_STATUS_CONFIG) as [LessonStatus, StatusConfig][]
).map(([value, { label }]) => ({ value, label }))

export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, StatusConfig> = {
  pending:   { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmée',  className: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejetée',    className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulée',    className: 'bg-gray-100 text-gray-600' },
}

export const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus, StatusConfig> = {
  pending:  { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approuvée',  className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejetée',    className: 'bg-red-100 text-red-700' },
}

export const INSTRUCTOR_STATUS_OPTIONS = (
  Object.entries(INSTRUCTOR_STATUS_CONFIG) as [InstructorStatus, StatusConfig][]
).map(([value, { label }]) => ({ value, label }))

export const PAYMENT_STATUS_OPTIONS = (
  Object.entries(PAYMENT_STATUS_CONFIG) as [PaymentStatus, StatusConfig][]
).map(([value, { label }]) => ({ value, label }))

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string }> = {
  cash:          { label: 'Espèces' },
  wave:          { label: 'Wave' },
  orange_money:  { label: 'Orange Money' },
  bank_transfer: { label: 'Virement bancaire' },
}

export const PAYMENT_METHOD_OPTIONS = (
  Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethod, { label: string }][]
).map(([value, { label }]) => ({ value, label }))
