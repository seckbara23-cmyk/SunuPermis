import type { NotificationProvider } from '../types'
import { MockProvider } from './mock'

export function getEmailProvider(): NotificationProvider {
  // TODO: Replace with Resend when RESEND_API_KEY is configured
  // import { ResendProvider } from './resend'
  // if (process.env.RESEND_API_KEY) return new ResendProvider(process.env.RESEND_API_KEY)

  return MockProvider
}

export function getSmsProvider(): NotificationProvider {
  // TODO: Replace with a live SMS provider when credentials are configured.
  // Senegalese market options:
  //   - Orange SMS API (ORANGE_SMS_API_KEY)
  //   - Infobip (INFOBIP_API_KEY + INFOBIP_BASE_URL)
  //   - Wave SMS (WAVE_SMS_API_KEY) — if Wave exposes a messaging API
  //
  // if (process.env.INFOBIP_API_KEY) return new InfobipProvider(...)
  // if (process.env.ORANGE_SMS_API_KEY) return new OrangeSmsProvider(...)

  return MockProvider
}

export function getWhatsAppProvider(): NotificationProvider {
  // TODO: Replace with WhatsApp Business API when META_WHATSAPP_TOKEN is configured
  // if (process.env.META_WHATSAPP_TOKEN) return new WhatsAppProvider(...)
  return MockProvider
}
