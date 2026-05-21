'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-sm w-full p-8 text-center">
        {/* Icon */}
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
          </svg>
        </div>

        {/* Brand */}
        <p className="text-xs font-semibold text-navy tracking-widest uppercase mb-4">
          SunuPermis
        </p>

        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          Vous êtes hors ligne
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Vous êtes hors ligne. Certaines fonctionnalités nécessitent une connexion internet.
        </p>

        {/* Retry button — triggers browser navigation which the SW will retry */}
        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
        >
          Réessayer
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Vérifiez votre connexion Wi-Fi ou données mobiles, puis réessayez.
        </p>
      </div>
    </div>
  )
}
