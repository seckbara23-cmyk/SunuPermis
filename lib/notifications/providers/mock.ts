import type { NotificationProvider, SendResult } from '../types'

export const MockProvider: NotificationProvider = {
  name: 'mock',

  async sendEmail(to: string, body: string): Promise<SendResult> {
    console.log('[MOCK EMAIL]', {
      to,
      preview: body.slice(0, 120),
      ts: new Date().toISOString(),
    })
    return {
      success: true,
      provider: 'mock',
      providerMessageId: `mock-email-${Date.now()}`,
    }
  },

  async sendSms(to: string, message: string): Promise<SendResult> {
    console.log('[MOCK SMS]', {
      to,
      preview: message.slice(0, 120),
      ts: new Date().toISOString(),
    })
    return {
      success: true,
      provider: 'mock',
      providerMessageId: `mock-sms-${Date.now()}`,
    }
  },
}
