import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPastExams, getStudentByProfileId } from '@/services/exams'
import { getInProgressExam } from '@/app/student/mock-exams/actions'
import ExamsClient from '@/components/exams/ExamsClient'

export default async function StudentExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/student')

  const student = await getStudentByProfileId(profile.id)

  if (!student) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Examens blancs</h1>
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-500 text-sm">
            Votre dossier élève n&apos;a pas encore été créé. Contactez votre auto-école.
          </p>
        </div>
      </div>
    )
  }

  const [pastExams, inProgressExam] = await Promise.all([
    getPastExams(student.id),
    getInProgressExam(),
  ])

  return <ExamsClient pastExams={pastExams} inProgressExam={inProgressExam} />
}
