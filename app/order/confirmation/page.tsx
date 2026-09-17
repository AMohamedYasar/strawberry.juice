import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams?: { orderId?: string; name?: string; address?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const orderId = searchParams?.orderId || 'CONFIRMED'
  const recipientName = searchParams?.name || user.email?.split('@')[0] || 'Valued Customer'
  const shippingAddress = searchParams?.address || 'Standard Delivery'

  // Fetch latest order from Supabase if orderId is provided
  let orderData: any = null
  if (orderId && orderId !== 'CONFIRMED' && orderId !== 'SUCCESS') {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()
    orderData = data
  }

  const totalPrice = orderData?.total_price ? `$${orderData.total_price.toFixed(2)}` : '$120.00'
  const orderStatus = orderData?.status || 'Confirmed'

  return (
    <div className="min-h-screen bg-luxury-black text-white relative overflow-hidden pt-28 pb-20 flex flex-col items-center justify-center">
      {/* Ambient glows */}
      <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-brand-coral/20 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-2xl relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-brand-red to-brand-coral p-[2px] mb-6 shadow-[0_0_40px_rgba(255,107,157,0.4)]">
            <div className="w-full h-full bg-luxury-black rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-widest text-glow uppercase mb-3">Order Confirmed</h1>
          <p className="text-white/60 tracking-[0.2em] uppercase text-xs">Thank you for experiencing the pure taste of luxury.</p>
        </div>

        {/* Order Details Card */}
        <div className="glass-panel rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-white/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-coral to-brand-red" />
          
          <div className="flex justify-between items-center pb-6 border-b border-white/10 flex-wrap gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-brand-coral font-semibold">Order Reference</p>
              <p className="text-sm font-mono text-white/90 mt-1">#{orderId.substring(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] tracking-widest uppercase border border-green-500/40 text-green-400 bg-green-500/10">
                {orderStatus}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="py-6 border-b border-white/10 flex items-center gap-6">
            <div className="w-20 h-24 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-b from-brand-red/30 to-transparent" />
              <span className="text-2xl z-10">🍓</span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium uppercase tracking-wider text-white">Premium Strawberry Nectar</h3>
              <p className="text-xs text-white/50 tracking-widest uppercase mt-1">750ml • Cold Pressed • Organic</p>
              <p className="text-xs text-white/40 tracking-widest uppercase mt-1">Quantity: 1</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-light text-glow-coral">{totalPrice}</p>
            </div>
          </div>

          {/* Shipping & Recipient */}
          <div className="py-6 border-b border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-brand-coral font-semibold mb-2">Recipient</h4>
              <p className="text-sm text-white/90 font-light tracking-wide">{recipientName}</p>
              <p className="text-xs text-white/50 font-light mt-1">{user.email}</p>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-brand-coral font-semibold mb-2">Delivery Address</h4>
              <p className="text-xs text-white/70 font-light leading-relaxed">{shippingAddress}</p>
            </div>
          </div>

          {/* Payment info */}
          <div className="pt-6 flex justify-between items-center text-xs text-white/50 tracking-widest uppercase">
            <span>Payment Method</span>
            <span className="text-white">Secure Encrypted Card</span>
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/account"
              className="flex-1 text-center rounded-2xl px-6 py-4 bg-white text-black font-semibold tracking-[0.2em] text-xs uppercase hover:bg-brand-coral hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,107,157,0.2)] hover:shadow-[0_0_30px_rgba(255,107,157,0.4)]"
            >
              View in Account
            </Link>
            <Link
              href="/"
              className="flex-1 text-center rounded-2xl px-6 py-4 bg-white/5 border border-white/10 text-white font-semibold tracking-[0.2em] text-xs uppercase hover:bg-white/10 transition-colors duration-300"
            >
              Back to Home
            </Link>
          </div>

        </div>

      </div>
    </div>
  )
}
