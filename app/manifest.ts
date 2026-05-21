import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'SunuPermis',
    short_name:       'SunuPermis',
    description:      'Plateforme de gestion pour auto-écoles au Sénégal',
    lang:             'fr',
    start_url:        '/student/learning',
    scope:            '/',
    display:          'standalone',
    orientation:      'portrait',
    theme_color:      '#131140',
    background_color: '#f9fafb',
    categories:       ['education'],
    icons: [
      {
        src:   '/icons/icon-192.png',
        sizes: '192x192',
        type:  'image/png',
      },
      {
        src:     '/icons/icon-512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icons/icon-512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
