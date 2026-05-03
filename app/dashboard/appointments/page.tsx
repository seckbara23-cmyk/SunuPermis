import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppointmentsForSchool, getEligibleStudents, getAppointmentForStudent } from '@/services/appointments'
import AppointmentsClient from '@/components/appointments/AppointmentsClient'
import StudentAppointmentView from '@/components/appointments/StudentAppointmentView'
import type { UserRole } from '@/types'

export default async function AppointmentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role as UserRole

  // ── super_admin → government appointments dashboard ────────
  if (role === 'super_admin') {
    redirect('/dashboard/appointments-admin')
  }

  // ── Student view ──────────────────────────────────────────
  if (role === 'student') {
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle()

    const appointment = studentRecord
      ? await getAppointmentForStudent(studentRecord.id)
      : null

    return <StudentAppointmentView appointment={appointment} />
  }

  // ── School admin view ──────────────────────────────────────
  if (role === 'school_admin') {
    if (!profile.driving_school_id) {
      return (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Rendez-vous</h1>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-6 py-5 text-sm">
            Votre compte n&apos;est pas encore rattaché à une auto-école. Contactez un administrateur.
          </div>
        </div>
      )
    }

    const [appointments, eligibleStudents] = await Promise.all([
      getAppointmentsForSchool(profile.driving_school_id),
      getEligibleStudents(profile.driving_school_id),
    ])

    return (
      <AppointmentsClient
        appointments={appointments}
        eligibleStudents={eligibleStudents}
      />
    )
  }

  // ── Any other role (instructor, unknown) ──────────────────
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Rendez-vous</h1>
      <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-xl px-6 py-5 text-sm">
        Vous n&apos;avez pas accès à cette page.
      </div>
    </div>
  )
}
