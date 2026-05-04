import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Full-width Senegal flag gradient — same top accent as every dashboard page */}
      <div className="h-1 shrink-0 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Login card — matches the dashboard welcome-card pattern */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Internal gradient accent bar — echoes the welcome card */}
            <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />

            {/* Brand header */}
            <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-navy text-lg font-bold select-none">SP</span>
              </div>
              <h1 className="text-2xl font-bold text-navy">SunuPermis</h1>
              <p className="mt-1.5 text-sm text-gray-500">Connectez-vous à votre espace</p>
            </div>

            {/* Form section */}
            <div className="px-8 py-7">
              <LoginForm />
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} SunuPermis · Gestion du permis de conduire
          </p>
        </div>
      </main>
    </div>
  )
}
