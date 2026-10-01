'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import { createOrder, getUserOrders, OrderItem } from '@/lib/ordersService'

const UNIT_PRICE = 30 // ₹30 per bottle as required

export default function CheckoutClient({ supabaseUser, orders: initialOrders }: { supabaseUser: any, orders: any[] | null }) {
  const { user: firebaseUser, loading: authLoading } = useAuth()
  const router = useRouter()

  const effectiveUser = firebaseUser || supabaseUser
  const effectiveEmail = firebaseUser?.email || supabaseUser?.email || ''
  const effectiveUid = firebaseUser?.uid || supabaseUser?.id || ''

  const [quantity, setQuantity] = useState(1)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '123',
  })
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch real orders from Firebase
  useEffect(() => {
    if (effectiveUid) {
      getUserOrders(effectiveUid).then((data) => {
        setOrders(data)
      })
    }
  }, [effectiveUid])

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta
      if (next < 1) return 1
      if (next > 10) return 10
      return next
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setErrorMessage(null)
    if (field === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 16)
      const formatted = digits.match(/.{1,4}/g)?.join(' ') || digits
      setFormData(prev => ({ ...prev, [field]: formatted }))
      return
    }
    if (field === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4)
      let formatted = digits
      if (digits.length > 2) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
      }
      setFormData(prev => ({ ...prev, [field]: formatted }))
      return
    }
    if (field === 'cvc') {
      const digits = value.replace(/\D/g, '').slice(0, 4)
      setFormData(prev => ({ ...prev, [field]: digits }))
      return
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('Please enter your full name for shipping.')
      return
    }
    if (!formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
      setErrorMessage('Please enter complete delivery address details.')
      return
    }

    if (paymentMethod === 'card') {
      const rawCard = formData.cardNumber.replace(/\s+/g, '')
      if (rawCard.length < 13) {
        setErrorMessage('Please enter a valid card number.')
        return
      }
    }

    setLoading(true)

    try {
      console.log('[Checkout] Processing mock payment of ₹', quantity * UNIT_PRICE)

      // Simulate payment network delay (1.2s)
      await new Promise((res) => setTimeout(res, 1200))

      // Save order to Firebase
      const saved = await createOrder({
        userId: effectiveUid,
        userEmail: effectiveEmail,
        items: 'Pure Nectar Cold-Pressed Strawberry Juice (500ml)',
        quantity,
        unitPrice: UNIT_PRICE,
        totalPrice: quantity * UNIT_PRICE,
        currency: 'INR',
        status: 'Confirmed',
        date: new Date().toISOString(),
        shipping: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim(),
        },
        paymentMethod: paymentMethod === 'card' ? 'Card (Demo)' : paymentMethod === 'upi' ? 'UPI (Demo)' : 'Pay on Delivery',
      })

      console.log('[Checkout] Order successfully created in Firebase:', saved.id)

      const recipientName = `${formData.firstName} ${formData.lastName}`.trim()
      const fullAddress = `${formData.address}, ${formData.city} ${formData.postalCode}`.trim()

      router.push(
        `/order/confirmation?orderId=${encodeURIComponent(saved.id)}&qty=${quantity}&total=${quantity * UNIT_PRICE}&name=${encodeURIComponent(recipientName)}&address=${encodeURIComponent(fullAddress)}`
      )
    } catch (err: any) {
      console.error('[Checkout] Order creation failed:', err)
      setErrorMessage(err?.message || 'Payment simulation failed. Please try again.')
      setLoading(false)
    }
  }

  // Not logged in: show the login modal
  if (!effectiveUser && !authLoading) {
    return (
      <div className="min-h-screen bg-luxury-black text-white relative overflow-hidden pt-32 pb-20 flex flex-col items-center justify-center">
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[150px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-brand-coral/20 rounded-full blur-[150px] pointer-events-none -z-10" />

        <div className="max-w-xl w-full text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 px-6">
          <h2 className="text-3xl font-light tracking-widest text-glow uppercase mb-4">Almost There</h2>
          <p className="text-white/60 tracking-widest uppercase text-sm mb-8">Sign in or create an account to securely access checkout.</p>
          <AuthForm redirectTo="/order" />
        </div>
      </div>
    )
  }

  if (authLoading && !effectiveUser) {
    return (
      <div className="min-h-screen bg-luxury-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-coral border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalPrice = quantity * UNIT_PRICE

  return (
    <div className="min-h-screen bg-luxury-black text-white relative overflow-hidden pt-32 pb-20">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-brand-coral/20 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <h1 className="text-4xl md:text-5xl font-light tracking-widest text-glow-coral uppercase mb-2 text-center">Secure Checkout</h1>
        <p className="text-xs uppercase tracking-[0.25em] text-white/50 text-center mb-12">Experience the pure taste of luxury</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Left Column: Product Summary & Quantity Selector */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex flex-col gap-8"
          >
            <div>
              <h3 className="text-xl font-light tracking-widest text-white uppercase mb-6 border-b border-white/10 pb-4">Your Selection</h3>
              
              <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-center">
                <div className="w-24 h-32 relative bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-red/20 to-transparent" />
                  <span className="text-4xl z-10">🍓</span>
                </div>
                
                <div className="flex-1 w-full">
                  <h4 className="text-sm tracking-widest uppercase font-semibold text-brand-coral mb-1">Premium Strawberry Nectar</h4>
                  <p className="text-xs text-white/50 tracking-[0.2em] leading-relaxed uppercase mb-3">500ml • Cold Pressed • 100% Organic</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-white/40 tracking-widest uppercase">Unit Price:</span>
                    <span className="text-lg font-light text-white">₹{UNIT_PRICE}</span>
                  </div>

                  {/* Quantity Selector: 1 to 10 */}
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                    <span className="text-xs uppercase tracking-widest text-white/70 font-semibold pl-2">Quantity (1-10)</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1 || loading}
                        className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-lg font-semibold text-glow-coral">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= 10 || loading}
                        className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Display Previous Orders from Firebase */}
            {orders && orders.length > 0 && (
              <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-both">
                <h3 className="text-sm tracking-widest text-brand-coral uppercase mb-4 flex items-center gap-3 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-brand-coral animate-pulse" />
                  Recent Orders ({orders.length})
                </h3>
                <div className="glass-panel p-6 rounded-[2rem] flex flex-col gap-3 max-h-72 overflow-y-auto">
                  {orders.slice(0, 3).map((order: any, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 text-xs">
                      <div>
                        <p className="font-mono text-white/80 font-medium">#{order.id.substring(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] text-white/40">{new Date(order.date).toLocaleDateString()} • Qty: {order.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-brand-coral font-semibold">₹{order.totalPrice}</p>
                        <span className="text-[9px] uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{order.status}</span>
                      </div>
                    </div>
                  ))}
                  <Link href="/account" className="mt-2 text-center">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 hover:text-white transition-colors">View All in Account →</span>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column: Premium Checkout Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex flex-col justify-center"
          >
            <div className="glass-panel rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-coral to-brand-red" />
              
              <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-8 relative z-10">
                
                {/* Contact Information */}
                <div>
                  <h4 className="text-xs font-semibold tracking-widest uppercase text-brand-coral mb-4">Contact Information</h4>
                  <div className="flex flex-col gap-3 relative">
                    <input 
                      type="email" 
                      name="email" 
                      value={effectiveEmail} 
                      readOnly 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white/50 focus:outline-none transition-all duration-300 font-light cursor-not-allowed" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] tracking-widest text-brand-coral uppercase border border-brand-coral/30 px-2 py-1 rounded-full">Secured</div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div>
                  <h4 className="text-xs font-semibold tracking-widest uppercase text-brand-coral mb-4">Shipping Address</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        name="firstName" 
                        placeholder="First Name" 
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={loading}
                        required
                        className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light disabled:opacity-50" 
                      />
                      <input 
                        type="text" 
                        name="lastName" 
                        placeholder="Last Name" 
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        disabled={loading}
                        required
                        className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light disabled:opacity-50" 
                      />
                    </div>
                    <input 
                      type="text" 
                      name="address" 
                      placeholder="Full Address" 
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={loading}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light disabled:opacity-50" 
                    />
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        name="city" 
                        placeholder="City" 
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        disabled={loading}
                        required
                        className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light disabled:opacity-50" 
                      />
                      <input 
                        type="text" 
                        name="postalCode" 
                        placeholder="Postal Code" 
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        disabled={loading}
                        required
                        className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light disabled:opacity-50" 
                      />
                    </div>
                  </div>
                </div>

                {/* Mock Payment Selector */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-semibold tracking-widest uppercase text-brand-coral">Payment Method (Mock Simulation)</h4>
                    <span className="text-[10px] uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Demo Mode</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-xs tracking-wider uppercase transition-all duration-300 flex flex-col items-center gap-1.5 ${
                        paymentMethod === 'card'
                          ? 'border-brand-coral bg-brand-coral/10 text-white shadow-[0_0_15px_rgba(255,107,157,0.2)]'
                          : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <span>💳</span>
                      <span>Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-2xl border text-xs tracking-wider uppercase transition-all duration-300 flex flex-col items-center gap-1.5 ${
                        paymentMethod === 'upi'
                          ? 'border-brand-coral bg-brand-coral/10 text-white shadow-[0_0_15px_rgba(255,107,157,0.2)]'
                          : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <span>📱</span>
                      <span>UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-2xl border text-xs tracking-wider uppercase transition-all duration-300 flex flex-col items-center gap-1.5 ${
                        paymentMethod === 'cod'
                          ? 'border-brand-coral bg-brand-coral/10 text-white shadow-[0_0_15px_rgba(255,107,157,0.2)]'
                          : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <span>💵</span>
                      <span>COD</span>
                    </button>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                      <input 
                        type="text" 
                        name="cardNumber" 
                        placeholder="Card Number" 
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        disabled={loading}
                        maxLength={19}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 tracking-widest text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light disabled:opacity-50" 
                      />
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          name="expiry" 
                          placeholder="MM/YY" 
                          value={formData.expiry}
                          onChange={(e) => handleInputChange('expiry', e.target.value)}
                          disabled={loading}
                          maxLength={5}
                          required
                          className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 tracking-widest text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light disabled:opacity-50" 
                        />
                        <input 
                          type="text" 
                          name="cvc" 
                          placeholder="CVC" 
                          value={formData.cvc}
                          onChange={(e) => handleInputChange('cvc', e.target.value)}
                          disabled={loading}
                          maxLength={4}
                          required
                          className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 tracking-widest text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light disabled:opacity-50" 
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center animate-in fade-in duration-300">
                      <p className="text-xs uppercase tracking-widest text-white/70 mb-1">Instant Demo UPI</p>
                      <p className="text-[11px] text-brand-coral font-mono">juiceco@mockupi</p>
                      <p className="text-[10px] text-white/40 mt-2">Clicking purchase will instantly confirm payment via mock gateway.</p>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center animate-in fade-in duration-300">
                      <p className="text-xs uppercase tracking-widest text-white/70 mb-1">Pay on Delivery</p>
                      <p className="text-[11px] text-white/50">Pay ₹{totalPrice} in cash or UPI when your juice arrives at your doorstep.</p>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs uppercase tracking-widest text-center font-semibold animate-in fade-in slide-in-from-top-2">
                    {errorMessage}
                  </div>
                )}

                {/* Live Order Total & Submit */}
                <div className="mt-4 border-t border-white/10 pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 font-light tracking-widest uppercase text-xs">Quantity ({quantity} x ₹{UNIT_PRICE})</span>
                    <span className="text-sm font-light text-white">₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-white/60 font-light tracking-widest uppercase text-xs">Shipping</span>
                    <span className="text-xs uppercase tracking-widest text-green-400">FREE</span>
                  </div>
                  <div className="flex justify-between items-center mb-8 border-t border-white/5 pt-4">
                    <span className="text-white font-medium tracking-widest uppercase text-sm">Order Total</span>
                    <span className="text-3xl font-light text-glow-coral">₹{totalPrice}</span>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    disabled={loading}
                    className="w-full relative px-8 py-6 bg-white text-black font-semibold tracking-[0.25em] text-xs md:text-sm uppercase rounded-2xl overflow-hidden group shadow-[0_0_30px_rgba(255,107,157,0.2)] hover:shadow-[0_0_60px_rgba(255,107,157,0.5)] transition-all duration-500 disabled:opacity-75 disabled:cursor-not-allowed"
                    type="submit"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-coral to-brand-red translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
                    <span className="relative z-10 group-hover:text-white transition-colors duration-500 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-black group-hover:border-white border-t-transparent rounded-full animate-spin transition-colors" />
                          Processing Mock Payment...
                        </>
                      ) : (
                        `Complete Purchase • ₹${totalPrice}`
                      )}
                    </span>
                  </motion.button>
                </div>

              </form>
            </div>
            
            <p className="text-center mt-8 text-[10px] text-white/30 tracking-[0.25em]">MOCK PAYMENT GATEWAY • FOR TESTING & DEMO</p>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
