import AuthForm from '@/components/AuthForm'

export default function LoginPage({ searchParams }: { searchParams?: { redirectTo?: string } }) {
  const redirectTo = searchParams?.redirectTo || '/'

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxury-black text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-coral/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <AuthForm redirectTo={redirectTo} />
    </div>
  )
}