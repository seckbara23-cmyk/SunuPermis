import { getAllAppointments } from '@/services/appointments'
import AdminAppointmentsClient from '@/components/appointments/AdminAppointmentsClient'

export default async function AdminReservationsPage() {
  const appointments = await getAllAppointments()
  return <AdminAppointmentsClient appointments={appointments} />
}
