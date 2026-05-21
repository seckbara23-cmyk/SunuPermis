export type NotificationStatus =
  | 'pending'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled'

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'log'

export interface SendResult {
  success: boolean
  provider: string
  providerMessageId?: string
  failureReason?: string
}

export interface NotificationProvider {
  readonly name: string
  sendEmail(to: string, body: string): Promise<SendResult>
  sendSms(to: string, message: string): Promise<SendResult>
}

export interface NotificationPayload {
  recipientUserId?: string
  recipientEmail?: string
  recipientPhone?: string
  channel: NotificationChannel
  type: string
  message: string
}
