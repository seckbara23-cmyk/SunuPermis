/**
 * Notification service — provider-abstracted implementation.
 *
 * Lifecycle per delivery:
 *   pending → queued → sending → sent | failed
 *
 * Uses the service-role admin client to write to the notifications table,
 * bypassing RLS (which only allows super_admin and own-user reads).
 * All real provider integrations are behind TODO stubs in
 * lib/notifications/providers/index.ts.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getEmailProvider, getSmsProvider } from '@/lib/notifications/providers'
import type { NotificationPayload, SendResult } from '@/lib/notifications/types'

export type { NotificationPayload }

// ── Core send function ─────────────────────────────────────────────────────────

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  // Insert initial record as 'queued'
  const { data: record, error: insertErr } = await admin
    .from('notifications')
    .insert({
      recipient_user_id: payload.recipientUserId ?? null,
      recipient_email:   payload.recipientEmail  ?? null,
      recipient_phone:   payload.recipientPhone  ?? null,
      channel:           payload.channel,
      type:              payload.type,
      status:            'queued',
      message:           payload.message,
    })
    .select('id')
    .single()

  if (insertErr || !record) {
    console.error('[NOTIFICATION] Failed to persist record:', insertErr?.message)
    return
  }

  // 'log' channel: mark sent immediately (no provider call needed)
  if (payload.channel === 'log') {
    console.log('[NOTIFICATION LOG]', {
      type:    payload.type,
      message: payload.message,
      ts:      now,
    })
    await admin
      .from('notifications')
      .update({ status: 'sent', sent_at: now, provider: 'log' })
      .eq('id', record.id)
    return
  }

  // Dispatch to provider
  let result: SendResult
  try {
    await admin
      .from('notifications')
      .update({ status: 'sending' })
      .eq('id', record.id)

    if (payload.channel === 'email' && payload.recipientEmail) {
      result = await getEmailProvider().sendEmail(payload.recipientEmail, payload.message)
    } else if (payload.channel === 'sms' && payload.recipientPhone) {
      result = await getSmsProvider().sendSms(payload.recipientPhone, payload.message)
    } else {
      // No valid recipient for channel — cancel
      await admin
        .from('notifications')
        .update({
          status:         'cancelled',
          failure_reason: 'No recipient address for channel',
        })
        .eq('id', record.id)
      return
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Provider error'
    await admin
      .from('notifications')
      .update({
        status:         'failed',
        failure_reason: reason,
        retry_count:    1,
      })
      .eq('id', record.id)
    console.error('[NOTIFICATION] Provider threw:', reason)
    return
  }

  // Update based on provider result
  if (result.success) {
    await admin
      .from('notifications')
      .update({
        status:              'sent',
        provider:            result.provider,
        provider_message_id: result.providerMessageId ?? null,
        sent_at:             new Date().toISOString(),
      })
      .eq('id', record.id)
  } else {
    await admin
      .from('notifications')
      .update({
        status:         'failed',
        provider:       result.provider,
        failure_reason: result.failureReason ?? 'Unknown failure',
        retry_count:    1,
      })
      .eq('id', record.id)
    console.error('[NOTIFICATION] Delivery failed:', {
      type:   payload.type,
      reason: result.failureReason,
    })
  }
}

// ── Domain notification helpers ────────────────────────────────────────────────

export async function notifyBookingApproved(params: {
  studentEmail:  string
  studentPhone?: string | null
  schoolEmail:   string
  examDate:      string
  examCenter:    string
  bookingId:     string
}) {
  const dateLabel = new Date(params.examDate).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const studentMsg = `Bonne nouvelle ! Votre inscription à l'examen de conduite du ${dateLabel} au centre « ${params.examCenter} » a été approuvée.`
  const schoolMsg  = `La réservation d'examen (ID: ${params.bookingId}) pour le ${dateLabel} a été approuvée.`

  await sendNotification({ recipientEmail: params.studentEmail, channel: 'email', type: 'booking_approved', message: studentMsg })

  if (params.studentPhone) {
    await sendNotification({ recipientPhone: params.studentPhone, channel: 'sms', type: 'booking_approved', message: studentMsg })
  }

  await sendNotification({ recipientEmail: params.schoolEmail, channel: 'email', type: 'booking_approved', message: schoolMsg })
}

export async function notifyBookingRejected(params: {
  studentEmail: string
  schoolEmail:  string
  examDate:     string
  examCenter:   string
}) {
  const dateLabel = new Date(params.examDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const msg = `Votre demande de réservation d'examen pour le ${dateLabel} au centre « ${params.examCenter} » a été rejetée. Contactez votre auto-école pour plus d'informations.`

  await sendNotification({ recipientEmail: params.studentEmail, channel: 'email', type: 'booking_rejected', message: msg })
  await sendNotification({ recipientEmail: params.schoolEmail,  channel: 'email', type: 'booking_rejected', message: `Réservation rejetée pour la session du ${dateLabel}.` })
}

export async function notifyAppointmentConfirmed(params: {
  studentEmail:  string
  studentPhone?: string | null
  studentName:   string
  schoolName:    string
  scheduledAt:   string
}) {
  const dateLabel = new Date(params.scheduledAt).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const msg = `Bonjour ${params.studentName}, votre rendez-vous d'examen a été validé pour le ${dateLabel}.`

  await sendNotification({ recipientEmail: params.studentEmail, channel: 'email', type: 'appointment_confirmed', message: msg })
  if (params.studentPhone) {
    await sendNotification({ recipientPhone: params.studentPhone, channel: 'sms', type: 'appointment_confirmed', message: msg })
  }
}

export async function notifyAppointmentRejected(params: {
  studentEmail:    string
  studentName:     string
  rejectionReason: string
}) {
  const msg = `Bonjour ${params.studentName}, votre demande de rendez-vous d'examen a été rejetée. Motif : ${params.rejectionReason}. Contactez votre auto-école pour plus d'informations.`
  await sendNotification({ recipientEmail: params.studentEmail, channel: 'email', type: 'appointment_rejected', message: msg })
}

export async function notifyStudentLifecycle(params: {
  action:       'suspended' | 'archived' | 'reactivated'
  studentEmail: string
  studentName:  string
  reason?:      string
}) {
  let msg: string
  let type: string

  if (params.action === 'suspended') {
    msg  = `Bonjour ${params.studentName}, votre compte étudiant SunuPermis a été suspendu.`
    if (params.reason) msg += ` Motif : ${params.reason}.`
    msg += ' Contactez votre auto-école ou l\'administration SunuPermis pour plus d\'informations.'
    type = 'student_suspended'
  } else if (params.action === 'archived') {
    msg  = `Bonjour ${params.studentName}, votre compte étudiant SunuPermis a été archivé.`
    if (params.reason) msg += ` Motif : ${params.reason}.`
    msg += ' Contactez votre auto-école ou l\'administration SunuPermis si vous avez des questions.'
    type = 'student_archived'
  } else {
    msg  = `Bonjour ${params.studentName}, votre compte étudiant SunuPermis a été réactivé. Vous pouvez vous connecter à votre espace élève.`
    type = 'student_reactivated'
  }

  await sendNotification({ recipientEmail: params.studentEmail, channel: 'email', type, message: msg })
}
