import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SunuPermis</h1>
          <p className="mt-2 text-gray-500">Connectez-vous à votre espace</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
