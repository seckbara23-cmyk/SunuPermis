export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getBookingConfirmation } from '@/services/exam-bookings'
import ConvocationCard from '@/components/appointments/ConvocationCard'
import PrintButton from '@/components/appointments/PrintButton'

export default async function StudentBookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/login')

  const data = await getBookingConfirmation(id)
  if (!data) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #convocation-card, #convocation-card * { visibility: visible; }
          #convocation-card { position: fixed; inset: 0; margin: 0; padding: 24px; }
        }
      `}} />

      <div className="flex items-center gap-3 print:hidden">
        <Link href="/student" className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour au tableau de bord
        </Link>
      </div>

      <ConvocationCard data={data} />

      <div className="flex justify-center print:hidden">
        <PrintButton />
      </div>
    </div>
  )
}
