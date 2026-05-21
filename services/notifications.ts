/**
 * Notification service — placeholder implementation.
 *
 * Currently logs to the console and persists a record to the `notifications`
 * table so deliveries are traceable. Replace the TODO sections with a real
 * provider (Resend for email, Twilio/Orange SMS for SMS) when ready.
 */

import { createClient } from '@/lib/supabase/server'

export interface NotificationPayload {
  recipientUserId?: string
  recipientEmail?: string
  recipientPhone?: string
  channel: 'email' | 'sms' | 'log'
  type: string
  message: string
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  // ── PLACEHOLDER: log delivery ──────────────────────────────
  console.log('[NOTIFICATION PLACEHOLDER]', {
    recipient: payload.recipientEmail ?? payload.recipientPhone ?? payload.recipientUserId,
    channel:   payload.channel,
    type:      payload.type,
    message:   payload.message,
    timestamp: new Date().toISOString(),
  })

  // TODO: wire real email provider (e.g. Resend)
  // if (payload.channel === 'email' && payload.recipientEmail) { ... }

  // TODO: wire real SMS provider (e.g. Twilio or local Senegalese provider)
  // if (payload.channel === 'sms' && payload.recipientPhone) { ... }

  // Persist the record for auditing
  try {
    const supabase = await createClient()
    await supabase.from('notifications').insert({
      recipient_user_id: payload.recipientUserId ?? null,
      recipient_email:   payload.recipientEmail  ?? null,
      recipient_phone:   payload.recipientPhone  ?? null,
      channel:           payload.channel,
      type:              payload.type,
      // TODO: update to 'sent' once a real provider (Resend/Twilio) confirms delivery
      status:            'pending',
      message:           payload.message,
    })
  } catch {
    // Non-fatal — log and continue
    console.error('[NOTIFICATION] Failed to persist notification record')
  }
}

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

  await sendNotification({
    recipientEmail: params.studentEmail,
    channel: 'email',
    type: 'booking_approved',
    message: studentMsg,
  })

  if (params.studentPhone) {
    await sendNotification({
      recipientPhone: params.studentPhone,
      channel: 'sms',
      type: 'booking_approved',
      message: studentMsg,
    })
  }

  await sendNotification({
    recipientEmail: params.schoolEmail,
    channel: 'email',
    type: 'booking_approved',
    message: schoolMsg,
  })
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
  const msg = `Bonjour ${params.studentName}, votre demande de rendez-vous d'examen a été rejetée. Motif : ${params.rejectionReason}. Contactez votre auto-école pour plus d'informations.`
  await sendNotification({ recipientEmail: params.studentEmail, channel: 'email', type: 'appointment_rejected', message: msg })
}
