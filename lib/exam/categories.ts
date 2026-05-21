export const EXAM_CATEGORIES = [
  'Code de la route',
  'Signalisation',
  'Priorités',
  'Sécurité routière',
  'Infractions',
  'Conduite pratique',
  'Mécanique de base',
] as const

export type ExamCategory = typeof EXAM_CATEGORIES[number]

export const CATEGORY_ICONS: Record<string, string> = {
  'Code de la route':   '📖',
  'Signalisation':      '🚦',
  'Priorités':          '⚠️',
  'Sécurité routière':  '🛡️',
  'Infractions':        '⛔',
  'Conduite pratique':  '🚗',
  'Mécanique de base':  '🔧',
}

export const EXAM_DURATION_SECONDS = 20 * 60  // 20 minutes
export const EXAM_SIZE = 10
export const PASS_THRESHOLD = 80
