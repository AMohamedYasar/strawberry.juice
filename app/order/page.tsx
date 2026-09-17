import { createClient } from '@/utils/supabase/server'
import AuthForm from '@/components/AuthForm'
import CheckoutClient from './CheckoutClient'

export default async function OrderPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-luxury-black text-white relative overflow-hidden pt-32 pb-20 flex flex-col items-center justify-center">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[150px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-brand-coral/20 rounded-full blur-[150px] pointer-events-none -z-10" />

        <div className="max-w-xl w-full text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-3xl font-light tracking-widest text-glow uppercase mb-4">Almost There</h2>
          <p className="text-white/60 tracking-widest uppercase text-sm mb-8">Sign in or create an account to securely access checkout.</p>
          <AuthForm redirectTo="/order" />
        </div>
      </div>
    )
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)

  return <CheckoutClient user={user} orders={orders} />
}
