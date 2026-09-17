'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { processOrder } from './actions'

export default function CheckoutClient({ user, orders }: { user: any, orders: any[] | null }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setErrorMessage(null)
    
    // Formatting helpers
    if (field === 'cardNumber') {
      // Allow only numbers, format groups of 4
      const digits = value.replace(/\D/g, '').slice(0, 16)
      const formatted = digits.match(/.{1,4}/g)?.join(' ') || digits
      setFormData(prev => ({ ...prev, [field]: formatted }))
      return
    }

    if (field === 'expiry') {
      // Allow only numbers, format MM/YY
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setErrorMessage(null)

    // Validate shipping fields
    if (!formData.firstName.trim()) {
      e.preventDefault()
      setErrorMessage('Please enter your first name.')
      console.warn('[Checkout] Validation failed: First name is missing')
      return
    }
    if (!formData.lastName.trim()) {
      e.preventDefault()
      setErrorMessage('Please enter your last name.')
      console.warn('[Checkout] Validation failed: Last name is missing')
      return
    }
    if (!formData.address.trim()) {
      e.preventDefault()
      setErrorMessage('Please enter your full delivery address.')
      console.warn('[Checkout] Validation failed: Address is missing')
      return
    }
    if (!formData.city.trim()) {
      e.preventDefault()
      setErrorMessage('Please enter your city.')
      console.warn('[Checkout] Validation failed: City is missing')
      return
    }
    if (!formData.postalCode.trim()) {
      e.preventDefault()
      setErrorMessage('Please enter your postal code.')
      console.warn('[Checkout] Validation failed: Postal code is missing')
      return
    }

    // Validate payment fields
    const rawCard = formData.cardNumber.replace(/\s+/g, '')
    if (!rawCard || rawCard.length < 13) {
      e.preventDefault()
      setErrorMessage('Please enter a valid card number (13-16 digits).')
      console.warn('[Checkout] Validation failed: Card number too short')
      return
    }

    if (!formData.expiry || !formData.expiry.includes('/')) {
      e.preventDefault()
      setErrorMessage('Please enter card expiration as MM/YY.')
      console.warn('[Checkout] Validation failed: Invalid expiry')
      return
    }

    const [month] = formData.expiry.split('/')
    const numMonth = parseInt(month, 10)
    if (isNaN(numMonth) || numMonth < 1 || numMonth > 12) {
      e.preventDefault()
      setErrorMessage('Invalid expiration month. Please enter MM/YY.')
      console.warn('[Checkout] Validation failed: Expiration month invalid')
      return
    }

    if (!formData.cvc || formData.cvc.length < 3) {
      e.preventDefault()
      setErrorMessage('Please enter a valid 3 or 4 digit security code (CVC).')
      console.warn('[Checkout] Validation failed: CVC invalid')
      return
    }

    console.log('[Checkout] Client validation passed. Submitting purchase order...')
    setLoading(true)
  }

  return (
    <div className="min-h-screen bg-luxury-black text-white relative overflow-hidden pt-32 pb-20">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-brand-coral/20 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <h1 className="text-4xl md:text-5xl font-light tracking-widest text-glow-coral uppercase mb-2 text-center">Secure Checkout</h1>
        <p className="text-xs uppercase tracking-[0.25em] text-white/50 text-center mb-12">Experience the pure taste of luxury</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Left Column: Product Summary */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex flex-col gap-12"
          >
            <div>
              <h3 className="text-xl font-light tracking-widest text-white uppercase mb-6 border-b border-white/10 pb-4">Your Selection</h3>
              <div className="glass-panel p-6 rounded-3xl flex gap-6 items-center">
                <div className="w-24 h-32 relative bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-red/20 to-transparent" />
                  <div className="text-xs uppercase tracking-widest text-brand-coral z-10 p-2 text-center">Premium Nectar</div>
                </div>
                <div>
                  <h4 className="text-sm tracking-widest uppercase font-semibold text-brand-coral mb-2">Premium Strawberry Nectar</h4>
                  <p className="text-xs text-white/50 tracking-[0.2em] leading-relaxed uppercase mb-4">750ml • Cold Pressed • Organic</p>
                  <p className="text-xl font-light text-white">$120.00</p>
                </div>
              </div>
            </div>

            {/* Display Previous Orders if returning user */}
            {orders && orders.length > 0 && (
              <div className="mt-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-both">
                <h3 className="text-sm tracking-widest text-brand-coral uppercase mb-6 flex items-center gap-3 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-brand-coral animate-pulse" />
                  Welcome Back, {user.email?.split('@')[0]}
                </h3>
                <div className="glass-panel p-6 rounded-[2rem] flex flex-col gap-4">
                  <h4 className="text-xs text-white/50 tracking-widest uppercase mb-2">Your Previous Orders</h4>
                  {orders.map((order: any, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                      <span className="text-sm font-light uppercase tracking-wider text-white/80">
                        Order #{order.id.split('-')[0].substring(0,6)}
                      </span>
                      <span className="text-xs text-brand-coral uppercase tracking-widest">{order.status}</span>
                    </div>
                  ))}
                  <Link href="/account" className="mt-4 text-center">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 hover:text-white transition-colors">View Full History →</span>
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
              
              <form action={processOrder} onSubmit={handleSubmit} className="flex flex-col gap-8 relative z-10">
                
                {/* Contact Information */}
                <div>
                  <h4 className="text-xs font-semibold tracking-widest uppercase text-brand-coral mb-4">Contact Information</h4>
                  <div className="flex flex-col gap-3 relative">
                    <input 
                      type="email" 
                      name="email" 
                      value={user?.email || ""} 
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

                {/* Payment Information */}
                <div>
                  <h4 className="text-xs font-semibold tracking-widest uppercase text-brand-coral mb-4">Secure Payment</h4>
                  <div className="flex flex-col gap-3">
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
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs uppercase tracking-widest text-center font-semibold animate-in fade-in slide-in-from-top-2">
                    {errorMessage}
                  </div>
                )}

                {/* Submitting Flow */}
                <div className="mt-4 border-t border-white/10 pt-8">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-white/60 font-light tracking-widest uppercase text-sm">Order Total</span>
                    <span className="text-3xl font-light text-glow">$120.00</span>
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
                          <span className="w-4 h-4 border-2 border-black group-hover:border-white border-t-transparent group-hover:border-t-transparent rounded-full animate-spin transition-colors" />
                          Processing Order...
                        </>
                      ) : (
                        'Complete Purchase'
                      )}
                    </span>
                  </motion.button>
                </div>

              </form>
            </div>
            
            <p className="text-center mt-8 text-[10px] text-white/30 tracking-[0.25em]">ENCRYPTED & SECURE <br className="md:hidden"/>POWERED BY STRIPE</p>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
