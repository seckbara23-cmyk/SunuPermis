import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentsPaginated, getDrivingSchools } from '@/services/students'
import StudentsClient from '@/components/students/StudentsClient'
import type { UserRole } from '@/types'

const PAGE_SIZE = 20

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; account_status?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role as UserRole
  const canAdd = role === 'school_admin' || role === 'super_admin'

  const { page: pageParam, account_status: accountStatusParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const accountStatusFilter = accountStatusParam ?? 'active'

  const [{ students, total }, drivingSchools] = await Promise.all([
    getStudentsPaginated(page, PAGE_SIZE, accountStatusFilter),
    role === 'super_admin' ? getDrivingSchools() : Promise.resolve([]),
  ])

  return (
    <StudentsClient
      students={students}
      canAdd={canAdd}
      role={role}
      drivingSchools={drivingSchools}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      basePath="/dashboard/students"
      accountStatusFilter={accountStatusFilter}
    />
  )
}
