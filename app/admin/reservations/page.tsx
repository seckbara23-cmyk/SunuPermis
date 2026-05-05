import { getAllAppointments } from '@/services/appointments'
import AdminAppointmentsClient from '@/components/appointments/AdminAppointmentsClient'

const VALID_FILTERS = ['pending', 'confirmed', 'rejected', 'all'] as const
type FilterValue = (typeof VALID_FILTERS)[number]

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminReservationsPage({ searchParams }: Props) {
  const params = await searchParams
  const activeFilter: FilterValue = VALID_FILTERS.includes(params.status as FilterValue)
    ? (params.status as FilterValue)
    : 'pending'

  const appointments = await getAllAppointments()

  return <AdminAppointmentsClient appointments={appointments} activeFilter={activeFilter} />
}
