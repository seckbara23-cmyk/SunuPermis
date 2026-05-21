/**
 * Student credential delivery foundation.
 *
 * Admin-triggered only. Generates a temporary password and queues
 * invitation notifications via the provider-abstracted notification
 * service. All events are audit-logged.
 *
 * The temporary password is returned to the calling server action
 * for display to the admin — it is NEVER stored in the database.
 *
 * TODO: Replace generateTemporaryPassword() with a Supabase Admin
 * invite flow (supabase.auth.admin.inviteUserByEmail) once real
 * email delivery is configured in lib/notifications/providers/.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/services/notifications'

// ── Password generator ─────────────────────────────────────────────────────────

function generateTemporaryPassword(): string {
  // Unambiguous character set (excludes 0/O, 1/l/I, etc.)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 12; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

// ── Invitation message templates ──────────────────────────────────────────────

function buildEmailInvitation(name: string, email: string, tempPassword: string): string {
  return [
    `Bonjour ${name},`,
    '',
    'Votre compte SunuPermis a été créé par votre auto-école.',
    '',
    'Vos identifiants de connexion :',
    `  Email          : ${email}`,
    `  Mot de passe   : ${tempPassword}`,
    '',
    'Veuillez changer votre mot de passe lors de votre première connexion.',
    '',
    'Pour vous connecter, rendez-vous sur la plateforme SunuPermis.',
    '',
    'À bientôt sur SunuPermis.',
  ].join('\n')
}

function buildSmsInvitation(name: string, email: string): string {
  return `Bonjour ${name}, votre compte SunuPermis est prêt. Connectez-vous avec l'email ${email}. Vérifiez votre email pour le mot de passe temporaire.`
}

// ── Main export ────────────────────────────────────────────────────────────────

export interface InvitationResult {
  error?: string
  temporaryPassword?: string
  notificationWarning?: string
}

export async function generateStudentInvitation(
  studentId:      string,
  actorProfileId: string,
  actorUserId:    string,
): Promise<InvitationResult> {
  const admin = createAdminClient()

  const { data: student } = await admin
    .from('students')
    .select('id, full_name, email, phone, driving_school_id')
    .eq('id', studentId)
    .single()

  if (!student) return { error: 'Élève introuvable.' }
  if (!student.email) return { error: 'Cet élève n\'a pas d\'adresse email.' }

  const tempPassword = generateTemporaryPassword()

  // Audit: credentials generated (log before sending — password never stored)
  await logAuditEvent({
    actorProfileId,
    actorUserId,
    actorRole:  'school_admin',
    action:     'student.credentials_generated',
    entityType: 'student',
    entityId:   studentId,
    metadata: {
      driving_school_id: student.driving_school_id,
      credential_type:   'temp_password',
      // NOTE: never include the actual password in metadata
    },
  })

  // Send email invitation
  let notificationWarning: string | undefined
  try {
    await sendNotification({
      recipientEmail: student.email,
      channel:        'email',
      type:           'student_invitation',
      message:        buildEmailInvitation(student.full_name, student.email, tempPassword),
    })

    // Best-effort SMS (secondary channel)
    if (student.phone) {
      await sendNotification({
        recipientPhone: student.phone,
        channel:        'sms',
        type:           'student_invitation',
        message:        buildSmsInvitation(student.full_name, student.email),
      })
    }

    await logAuditEvent({
      actorProfileId,
      actorUserId,
      actorRole:  'school_admin',
      action:     'student.invitation_sent',
      entityType: 'student',
      entityId:   studentId,
      metadata: {
        driving_school_id: student.driving_school_id,
        channels: student.phone ? ['email', 'sms'] : ['email'],
      },
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown error'
    await logAuditEvent({
      actorProfileId,
      actorUserId,
      actorRole:  'school_admin',
      action:     'notification.failed',
      entityType: 'student',
      entityId:   studentId,
      metadata: {
        driving_school_id: student.driving_school_id,
        notification_type: 'student_invitation',
        error:             reason,
      },
    }).catch(() => {})
    notificationWarning = 'Identifiants générés, mais la notification a échoué. Communiquez le mot de passe manuellement.'
  }

  return { temporaryPassword: tempPassword, notificationWarning }
}
