import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Senegal flag gradient — matches the dashboard layout */}
      <div className="h-1 shrink-0 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-navy">SunuPermis</h1>
            <p className="mt-2 text-gray-500">Connectez-vous à votre espace</p>
          </div>
          <LoginForm />
        </div>
      </main>
    </div>
  )
}
