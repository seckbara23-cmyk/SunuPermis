import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAppointmentConfirmation } from '@/services/appointments'
import ConvocationCard from '@/components/appointments/ConvocationCard'
import PrintButton from '@/components/appointments/PrintButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DashboardConvocationPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'school_admin') redirect('/login')

  // RLS ensures school_admin can only read their own school's appointments
  const appt = await getAppointmentConfirmation(id)
  if (!appt) notFound()

  // Extra guard: the appointment must belong to this school
  if (appt.driving_school_id !== profile.driving_school_id) notFound()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #convocation-card, #convocation-card * { visibility: visible; }
          #convocation-card { position: fixed; inset: 0; margin: 0; padding: 24px; }
        }
      `}} />

      <div className="space-y-5">
        <div className="print:hidden">
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux rendez-vous
          </Link>
        </div>

        <ConvocationCard data={appt} />

        <div className="print:hidden flex justify-center">
          <PrintButton />
        </div>
      </div>
    </>
  )
}
