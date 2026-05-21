'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production — avoids interfering with Next.js HMR in dev
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => {
        // SW registration failure is non-fatal — app works normally without it
      })
  }, [])

  return null
}
