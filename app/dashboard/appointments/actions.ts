'use server'

import { revalidatePath } from 'next/cache'
import {
  createAppointmentRequest,
  approveAppointment,
  rejectAppointment as svcRejectAppointment,
  cancelAppointment as svcCancelAppointment,
} from '@/services/appointments'

function revalidateBoth() {
  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/appointments-admin')
  revalidatePath('/admin/reservations')
}

export async function requestAppointment(
  studentId: string
): Promise<{ error?: string }> {
  const result = await createAppointmentRequest(studentId)
  if (!result.error) revalidateBoth()
  return result
}

export async function confirmAppointment(
  appointmentId: string,
  scheduledAt: string
): Promise<{ error?: string }> {
  const result = await approveAppointment(appointmentId, scheduledAt)
  if (!result.error) revalidateBoth()
  return result
}

export async function rejectAppointment(
  appointmentId: string,
  reason: string
): Promise<{ error?: string }> {
  const result = await svcRejectAppointment(appointmentId, reason)
  if (!result.error) revalidateBoth()
  return result
}

export async function cancelAppointment(
  appointmentId: string
): Promise<{ error?: string }> {
  const result = await svcCancelAppointment(appointmentId)
  if (!result.error) revalidateBoth()
  return result
}
