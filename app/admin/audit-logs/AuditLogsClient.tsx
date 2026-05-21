'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef } from 'react'

export interface AuditLog {
  id: string
  actor_role: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor: { full_name: string } | null
}

const ACTION_LABELS: Record<string, string> = {
  approve_school:       'Approbation auto-école',
  reject_school:        'Rejet auto-école',
  toggle_school_status: 'Changement de statut',
  confirm_appointment:  'Validation rendez-vous',
  reject_appointment:   'Rejet rendez-vous',
  cancel_appointment:   'Annulation rendez-vous',
  approve_booking:      'Approbation réservation',
  reject_booking:       'Rejet réservation',
  record_result:        'Saisie résultat',
}

const ENTITY_LABELS: Record<string, string> = {
  driving_school: 'Auto-école',
  appointment:    'Rendez-vous',
  exam_booking:   'Réservation',
  exam_session:   "Session d'examen",
  student:        'Élève',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin:  'Administration',
  school_admin: 'Auto-école',
  student:      'Élève',
  instructor:   'Moniteur',
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action
}
function entityLabel(type: string) {
  return ENTITY_LABELS[type] ?? type
}
function roleLabel(role: string | null) {
  return role ? (ROLE_LABELS[role] ?? role) : '—'
}
function shortId(id: string | null) {
  return id ? id.slice(0, 8) + '…' : '—'
}
function metaSummary(meta: Record<string, unknown>): string {
  const keys = Object.keys(meta)
  if (keys.length === 0) return '—'
  return keys
    .slice(0, 3)
    .map((k) => `${k}: ${String(meta[k]).slice(0, 20)}`)
    .join(' · ')
}

const KNOWN_ACTIONS = Object.keys(ACTION_LABELS)

interface Props {
  logs: AuditLog[]
  total: number
  page: number
  search: string
  actionFilter: string
}

export default function AuditLogsClient({ logs, total, page, search, actionFilter }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const formRef  = useRef<HTMLFormElement>(null)

  function buildHref(overrides: Record<string, string | number>) {
    const params = new URLSearchParams()
    if (search)       params.set('search', search)
    if (actionFilter) params.set('action', actionFilter)
    params.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === '' || v === 0) params.delete(k)
      else params.set(k, String(v))
    })
    return `${pathname}?${params.toString()}`
  }

  const totalPages = Math.ceil(total / 25)

  return (
    <div className="space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journaux d&apos;audit</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} entrée{total !== 1 ? 's' : ''} · lecture seule
          </p>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <form
        ref={formRef}
        method="GET"
        action={pathname}
        className="flex flex-wrap gap-3"
      >
        <input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Rechercher une action, entité…"
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
        />
        <select
          name="action"
          defaultValue={actionFilter}
          onChange={() => formRef.current?.submit()}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white"
        >
          <option value="">Toutes les actions</option>
          {KNOWN_ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
        >
          Filtrer
        </button>
        {(search || actionFilter) && (
          <a
            href={pathname}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Réinitialiser
          </a>
        )}
      </form>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">Aucun journal d&apos;audit pour ce filtre.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Date', 'Acteur', 'Action', 'Entité', 'Réf.', 'Détails'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      {log.actor?.full_name ? (
                        <p className="text-sm font-medium text-gray-900">{log.actor.full_name}</p>
                      ) : null}
                      <p className="text-xs text-gray-400">{roleLabel(log.actor_role)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-navy/10 text-navy">
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {entityLabel(log.entity_type)}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 font-mono">
                      {shortId(log.entity_id)}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 max-w-xs truncate">
                      {metaSummary(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-gray-500">
            Page {page} sur {totalPages} · {total} entrée{total !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={buildHref({ page: page - 1 })}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Précédent
              </a>
            )}
            {page < totalPages && (
              <a
                href={buildHref({ page: page + 1 })}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Suivant →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
