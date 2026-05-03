import { createClient } from '@/lib/supabase/server'
import type { AppointmentWithStudent, AppointmentWithDetails } from '@/types'

const APPOINTMENT_SELECT_SCHOOL = `
  id, student_id, driving_school_id, requested_by, exam_session_id,
  scheduled_at, status, rejection_reason, confirmed_by, confirmed_at,
  updated_at, created_at,
  students(full_name)
` as const

const APPOINTMENT_SELECT_ADMIN = `
  id, student_id, driving_school_id, requested_by, exam_session_id,
  scheduled_at, status, rejection_reason, confirmed_by, confirmed_at,
  updated_at, created_at,
  students(full_name),
  driving_schools(name)
` as const

export async function getAppointmentsForSchool(
  schoolId: string
): Promise<AppointmentWithStudent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT_SCHOOL)
    .eq('driving_school_id', schoolId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AppointmentWithStudent[]
}

export async function getAllAppointments(): Promise<AppointmentWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT_ADMIN)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AppointmentWithDetails[]
}

export async function getAppointmentForStudent(
  studentId: string
): Promise<AppointmentWithStudent | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT_SCHOOL)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data as unknown as AppointmentWithStudent | null
}

export async function getEligibleStudents(
  schoolId: string
): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('driving_school_id', schoolId)
    .eq('training_status', 'ready_for_exam')
    .order('full_name')

  if (error) throw new Error(error.message)
  return data ?? []
}
