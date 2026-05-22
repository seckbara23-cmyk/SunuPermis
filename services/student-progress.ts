import { createClient } from '@/lib/supabase/server'

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'
export type BookingStatus     = 'pending' | 'approved'  | 'rejected'

export interface StudentProgressAppointment {
  id: string
  status: AppointmentStatus
  confirmationReference: string | null
  examDate: string | null
  examLocation: string | null
  rejectionReason: string | null
  requestedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  createdAt: string
}

export interface StudentProgressBooking {
  id: string
  status: BookingStatus
  examDate: string | null
  examLocation: string | null
  approvedAt: string | null
  createdAt: string
}

export interface StudentProgressMockExams {
  count: number
  bestScore: number | null
  passed: boolean
  recent: { score: number; passed: boolean; created_at: string }[]
}

export interface StudentProgress {
  // Pre-computed boolean flags for checklist
  appointmentRequested: boolean
  appointmentApproved:  boolean
  mockExamPassed:       boolean
  // Raw detail — appointment takes priority over booking when both exist
  appointment: StudentProgressAppointment | null
  booking:     StudentProgressBooking | null
  mockExams:   StudentProgressMockExams
}

export async function getStudentProgress(studentId: string): Promise<StudentProgress> {
  const supabase = await createClient()

  const [{ data: apptData }, { data: bookingRaw }, { data: examData }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, status, rejection_reason, scheduled_at, requested_at, approved_at, rejected_at, created_at, confirmation_reference, exam_location')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('exam_bookings')
      .select('id, status, approved_at, created_at, exam_sessions ( exam_date, exam_center )')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('mock_exams')
      .select('score, passed, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const exams = examData ?? []
  const mockPassed = exams.some((e) => e.passed)
  const scores = exams.map((e) => e.score)

  const appointment: StudentProgressAppointment | null = apptData
    ? {
        id:                    apptData.id,
        status:                apptData.status as AppointmentStatus,
        confirmationReference: apptData.confirmation_reference ?? null,
        examDate:              apptData.scheduled_at ?? null,
        examLocation:          apptData.exam_location ?? null,
        rejectionReason:       apptData.rejection_reason ?? null,
        requestedAt:           apptData.requested_at ?? null,
        approvedAt:            apptData.approved_at ?? null,
        rejectedAt:            apptData.rejected_at ?? null,
        createdAt:             apptData.created_at,
      }
    : null

  type BookingRaw = {
    id: string
    status: string
    approved_at: string | null
    created_at: string
    exam_sessions: { exam_date: string; exam_center: string } | null
  }
  const bk = bookingRaw as BookingRaw | null
  const booking: StudentProgressBooking | null = bk
    ? {
        id:          bk.id,
        status:      bk.status as BookingStatus,
        examDate:    bk.exam_sessions?.exam_date ?? null,
        examLocation: bk.exam_sessions?.exam_center ?? null,
        approvedAt:  bk.approved_at ?? null,
        createdAt:   bk.created_at,
      }
    : null

  const isApproved = appointment?.status === 'confirmed' || booking?.status === 'approved'

  return {
    appointmentRequested: !!appointment || !!booking,
    appointmentApproved:  isApproved,
    mockExamPassed:       mockPassed,
    appointment,
    booking,
    mockExams: {
      count:     exams.length,
      bestScore: scores.length > 0 ? Math.max(...scores) : null,
      passed:    mockPassed,
      recent:    exams,
    },
  }
}
