'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserOrders, OrderItem } from '@/lib/ordersService'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderItem | null>(null)

  const orderId = searchParams.get('orderId') || 'CONFIRMED'
  const paramName = searchParams.get('name') || ''
  const paramAddress = searchParams.get('address') || ''
  const paramQty = parseInt(searchParams.get('qty') || '1', 10)
  const paramTotal = searchParams.get('total') || `${paramQty * 30}`

  useEffect(() => {
    if (user?.uid) {
      getUserOrders(user.uid).then((orders) => {
        const found = orders.find((o) => o.id === orderId)
        if (found) setOrder(found)
      })
    }
  }, [user, orderId])

  const recipientName = order?.shipping?.firstName
    ? `${order.shipping.firstName} ${order.shipping.lastName}`
    : paramName || user?.displayName || user?.email?.split('@')[0] || 'Valued Customer'

  const shippingAddress = order?.shipping?.address
    ? `${order.shipping.address}, ${order.shipping.city} ${order.shipping.postalCode}`
    : paramAddress || 'Standard Delivery'

  const quantity = order?.quantity || paramQty
  const totalPrice = order?.totalPrice ? `₹${order.totalPrice}` : `₹${paramTotal}`
  const orderStatus = order?.status || 'Confirmed'

  const handlePrintReceipt = () => {
    window.print()
  }

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
          <p className="text-white/60 tracking-[0.2em] uppercase text-xs">Payment Successful • Your Pure Nectar is Being Prepared</p>
        </div>

        {/* Order Details Card / Printable Receipt */}
        <div id="receipt-card" className="glass-panel rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-white/10 print:bg-white print:text-black">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-coral to-brand-red" />
          
          <div className="flex justify-between items-center pb-6 border-b border-white/10 flex-wrap gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-brand-coral font-semibold">Order Reference</p>
              <p className="text-sm font-mono text-white/90 mt-1 font-semibold">#{orderId.substring(0, 10).toUpperCase()}</p>
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
              <p className="text-xs text-white/50 tracking-widest uppercase mt-1">500ml • Cold Pressed • Organic</p>
              <p className="text-xs text-brand-coral tracking-widest uppercase mt-1">₹30 per bottle • Qty: {quantity}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-light text-glow-coral">{totalPrice}</p>
            </div>
          </div>

          {/* Shipping & Recipient */}
          <div className="py-6 border-b border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-brand-coral font-semibold mb-2">Recipient</h4>
              <p className="text-sm text-white/90 font-light tracking-wide">{recipientName}</p>
              <p className="text-xs text-white/50 font-light mt-1">{user?.email || 'Customer'}</p>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-brand-coral font-semibold mb-2">Delivery Address</h4>
              <p className="text-xs text-white/70 font-light leading-relaxed">{shippingAddress}</p>
            </div>
          </div>

          {/* Payment info */}
          <div className="pt-6 flex justify-between items-center text-xs text-white/50 tracking-widest uppercase">
            <span>Payment Method</span>
            <span className="text-white font-medium">Demo Payment (Simulated)</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 print:hidden">
            <button
              onClick={handlePrintReceipt}
              className="flex-1 text-center rounded-2xl px-6 py-4 bg-white/10 border border-white/20 text-white font-semibold tracking-[0.2em] text-xs uppercase hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-brand-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download / Print Receipt
            </button>
            <Link
              href="/account"
              className="flex-1 text-center rounded-2xl px-6 py-4 bg-white text-black font-semibold tracking-[0.2em] text-xs uppercase hover:bg-brand-coral hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,107,157,0.2)] hover:shadow-[0_0_30px_rgba(255,107,157,0.4)] flex items-center justify-center"
            >
              View in My Account →
            </Link>
          </div>

        </div>

      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-coral border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}
