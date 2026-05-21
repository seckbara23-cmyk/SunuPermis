import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { StudentWithSchool, TrainingStatus } from '@/types'

const STATUS_BADGE: Record<TrainingStatus, { label: string; className: string }> = {
  registered:    { label: 'Inscrit',             className: 'bg-gray-100 text-gray-600' },
  in_training:   { label: 'En formation',        className: 'bg-indigo-100 text-indigo-700' },
  ready_for_exam:{ label: 'Prêt pour l\'examen', className: 'bg-amber-100 text-amber-700' },
  completed:     { label: 'Terminé',             className: 'bg-green-100 text-green-700' },
  inactive:      { label: 'Inactif',             className: 'bg-red-100 text-red-700' },
}

export default async function AdminStudentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/login')

  const { data } = await supabase
    .from('students')
    .select('*, driving_schools(name)')
    .order('created_at', { ascending: false })

  const students = (data ?? []) as StudentWithSchool[]

  // Batch-generate signed URLs for all students who have a document
  const docPaths = students
    .map((s) => s.medical_document_url)
    .filter((p): p is string => !!p)

  const signedUrlMap: Record<string, string> = {}
  if (docPaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from('medical-documents')
      .createSignedUrls(docPaths, 3600)
    if (signedUrls) {
      for (const item of signedUrls) {
        if (item.path && item.signedUrl) signedUrlMap[item.path] = item.signedUrl
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
        <p className="text-sm text-gray-500 mt-1">
          {students.length} élève{students.length !== 1 ? 's' : ''} enregistré{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {students.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">Aucun élève enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Nom', 'Auto-école', 'Téléphone', 'Groupe sanguin', 'Document médical', 'Statut formation', 'Inscrit le'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => {
                  const badge = STATUS_BADGE[s.training_status]
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{s.driving_schools?.name ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{s.phone || '—'}</td>
                      <td className="px-5 py-4">
                        {s.blood_type ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            {s.blood_type}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Non renseigné</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {s.medical_document_url && signedUrlMap[s.medical_document_url] ? (
                          <a
                            href={signedUrlMap[s.medical_document_url]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-navy hover:underline"
                          >
                            Voir le document
                          </a>
                        ) : s.medical_document_url ? (
                          <span className="text-xs text-gray-400">Uploadé</span>
                        ) : (
                          <span className="text-xs text-gray-400">Non uploadé</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
