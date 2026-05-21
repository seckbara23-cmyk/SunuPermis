'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed]     = useState(false)

  useEffect(() => {
    // Already installed — don't show banner
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Check if user previously dismissed the banner this session
    if (sessionStorage.getItem('pwa-install-dismissed')) {
      setDismissed(true)
      return
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }

    function onAppInstalled() {
      setPromptEvent(null)
      setDismissed(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!promptEvent) return
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    setPromptEvent(null)
    if (outcome === 'dismissed') {
      sessionStorage.setItem('pwa-install-dismissed', '1')
      setDismissed(true)
    }
  }

  function handleDismiss() {
    sessionStorage.setItem('pwa-install-dismissed', '1')
    setDismissed(true)
    setPromptEvent(null)
  }

  if (!promptEvent || dismissed) return null

  return (
    <div className="mx-0 mb-4 flex items-center gap-3 rounded-xl border border-navy/20 bg-navy/5 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Installer SunuPermis</p>
        <p className="text-xs text-gray-500 truncate">Accédez rapidement depuis votre téléphone</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90 transition-colors"
        >
          Installer
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
