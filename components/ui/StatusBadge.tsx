import {
  TRAINING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  INSTRUCTOR_STATUS_CONFIG,
  LESSON_STATUS_CONFIG,
  APPROVAL_STATUS_CONFIG,
  APPOINTMENT_STATUS_CONFIG,
  ACCOUNT_STATUS_CONFIG,
} from '@/lib/formatters'
import type { TrainingStatus, PaymentStatus, InstructorStatus, LessonStatus, ApprovalStatus, AppointmentStatus, AccountStatus } from '@/types'

export function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  const { label, className } = TRAINING_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, className } = PAYMENT_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  const { label, className } = LESSON_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className } = APPOINTMENT_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const { label, className } = APPROVAL_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export function InstructorStatusBadge({ status }: { status: InstructorStatus }) {
  const { label, className } = INSTRUCTOR_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const { label, className } = ACCOUNT_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
