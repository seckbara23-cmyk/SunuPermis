export type UserRole = 'super_admin' | 'school_admin' | 'instructor' | 'student'

export interface Profile {
  id: string
  user_id: string
  full_name: string
  phone: string | null
  role: UserRole
  driving_school_id: string | null
  created_at: string
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface DrivingSchool {
  id: string
  name: string
  address: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  approval_status: ApprovalStatus
  rejection_reason: string | null
  approved_at: string | null
  approved_by: string | null
  updated_at: string
  created_at: string
}

export type TrainingStatus = 'registered' | 'in_training' | 'ready_for_exam' | 'completed' | 'inactive'
export type PaymentStatus  = 'pending' | 'partial' | 'paid' | 'overdue'

export interface Student {
  id: string
  driving_school_id: string
  profile_id: string | null
  full_name: string
  phone: string
  email: string
  date_of_birth: string
  address: string
  license_category: string
  training_status: TrainingStatus
  payment_status: PaymentStatus
  blood_type: string | null
  medical_document_url: string | null
  enrollment_date: string
  created_at: string
  updated_at: string
}

export interface StudentWithSchool extends Student {
  driving_schools: { name: string }
}

export type InstructorStatus = 'active' | 'inactive'

export interface Instructor {
  id: string
  driving_school_id: string
  profile_id: string | null
  full_name: string
  phone: string
  email: string
  status: InstructorStatus
  created_at: string
}

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed'

export interface Lesson {
  id: string
  student_id: string
  instructor_id: string
  lesson_type: string
  start_time: string
  end_time: string
  status: LessonStatus
  notes: string | null
  created_at: string
}

export interface LessonWithNames extends Lesson {
  students: { full_name: string }
  instructors: { full_name: string }
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'

export interface Appointment {
  id: string
  student_id: string
  driving_school_id: string
  requested_by: string | null
  exam_session_id: string | null
  scheduled_at: string | null
  status: AppointmentStatus
  rejection_reason: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  updated_at: string
  created_at: string
}

export interface AppointmentWithStudent extends Appointment {
  students: { full_name: string }
}

export interface AppointmentWithDetails extends Appointment {
  students: { full_name: string }
  driving_schools: { name: string }
}

export type PaymentMethod = 'cash' | 'wave' | 'orange_money' | 'bank_transfer'

export interface Payment {
  id: string
  driving_school_id: string
  student_id: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  payment_date: string
  notes: string | null
  created_at: string
}

export interface PaymentWithStudent extends Payment {
  students: { full_name: string }
}

export interface ExamQuestion {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}

export interface ExamQuestionForDisplay {
  id: string
  question_text: string
  options: string[]
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}

export interface MockExam {
  id: string
  student_id: string
  score: number
  total_questions: number
  passed: boolean
  created_at: string
}

export interface ExamSubmitResult {
  examId: string
  score: number
  totalQuestions: number
  correctCount: number
  passed: boolean
}

// ── Exam sessions ──────────────────────────────────────────────

export type ExamSessionStatus = 'open' | 'closed'

export interface ExamSession {
  id: string
  exam_date: string
  exam_center: string
  available_slots: number
  status: ExamSessionStatus
  created_by: string | null
  created_at: string
}

// ── Exam bookings ──────────────────────────────────────────────

export type ExamBookingStatus = 'pending' | 'approved' | 'rejected'
export type ExamResult        = 'passed' | 'failed'

export interface ExamBooking {
  id: string
  student_id: string
  driving_school_id: string
  exam_session_id: string
  status: ExamBookingStatus
  result: ExamResult | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface ExamBookingWithDetails extends ExamBooking {
  students:       { full_name: string; email: string; phone: string | null }
  driving_schools: { name: string }
  exam_sessions:  { exam_date: string; exam_center: string; available_slots: number }
}

// ── Notifications ──────────────────────────────────────────────

export type NotificationChannel = 'email' | 'sms' | 'log'
export type NotificationStatus  = 'pending' | 'sent' | 'failed'

export interface Notification {
  id: string
  recipient_user_id: string | null
  recipient_email: string | null
  recipient_phone: string | null
  channel: NotificationChannel
  type: string
  status: NotificationStatus
  message: string
  created_at: string
}
