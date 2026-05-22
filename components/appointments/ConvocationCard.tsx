import type { AppointmentConfirmationData } from '@/services/appointments'

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-40">{label}</span>
      <span className={`text-sm font-medium text-right min-w-0 ${highlight ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

interface Props {
  data: AppointmentConfirmationData
}

export default function ConvocationCard({ data }: Props) {
  const student       = Array.isArray(data.students)      ? data.students[0]      : data.students
  const school        = Array.isArray(data.driving_schools) ? data.driving_schools[0] : data.driving_schools

  const examDateLabel = data.scheduled_at
    ? new Date(data.scheduled_at).toLocaleString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

  const examDateOnly = data.scheduled_at
    ? new Date(data.scheduled_at).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'

  const examTime = data.scheduled_at
    ? new Date(data.scheduled_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit',
      })
    : null

  const confirmedLabel = data.confirmed_at
    ? new Date(data.confirmed_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'

  return (
    <div id="convocation-card" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-2xl w-full mx-auto">
      {/* Header */}
      <div className="h-1.5 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-navy tracking-widest uppercase mb-1">SunuPermis</p>
            <h1 className="text-2xl font-bold text-gray-900">Convocation à l&apos;examen</h1>
            <p className="text-sm text-gray-500 mt-1">Code de la route — Permis de conduire</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400 mb-1">Référence</p>
            <p className="text-lg font-bold font-mono tracking-wider text-navy">
              {data.confirmation_reference ?? '—'}
            </p>
            <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-semibold mt-1">
              Confirmé
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-8 py-5">
        <Row label="Candidat"     value={student?.full_name ?? '—'} />
        <Row label="Catégorie"    value={`Permis ${student?.license_category ?? '—'}`} />
        <Row label="Auto-école"   value={school?.name ?? '—'} />
        <Row label="Date d'examen" value={examDateOnly} highlight />
        {examTime && <Row label="Heure"       value={examTime} highlight />}
        <Row label="Lieu"         value={data.exam_location ?? 'À confirmer par le centre'} />
        <Row label="Validé le"    value={confirmedLabel} />
      </div>

      {/* Instructions */}
      <div className="mx-8 mb-6 rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">
          Instructions pour le jour de l&apos;examen
        </p>
        <ul className="space-y-1.5">
          {[
            "Se présenter 30 minutes avant l'heure indiquée",
            'Apporter une pièce d\'identité valide (CNI ou passeport)',
            'Apporter cette convocation imprimée ou sur téléphone',
            'Respecter les consignes du centre d\'examen',
          ].map((instr) => (
            <li key={instr} className="flex items-start gap-2 text-sm text-blue-700">
              <span className="mt-0.5 text-blue-400 shrink-0">•</span>
              {instr}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-8 pb-6 text-center">
        <p className="text-xs text-gray-400">
          Document généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' — '}Ce document est officiel. Référence : <span className="font-mono font-semibold">{data.confirmation_reference ?? '—'}</span>
        </p>
      </div>
    </div>
  )
}
