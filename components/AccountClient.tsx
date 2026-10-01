'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/utils/supabase/client'
import { updateProfile } from 'firebase/auth'
import {
  getUserOrders,
  OrderItem,
  saveUserProfile,
  getUserProfile,
  UserProfileData,
} from '@/lib/ordersService'

export default function AccountClient({
  initialSupabaseUser,
  initialOrders,
}: {
  initialSupabaseUser: any
  initialOrders: any[] | null
}) {
  const { user: firebaseUser, loading: authLoading, logout: firebaseLogout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const router = useRouter()

  const effectiveUser = firebaseUser || initialSupabaseUser
  const effectiveEmail = firebaseUser?.email || initialSupabaseUser?.email || 'Customer'
  const effectiveUid = firebaseUser?.uid || initialSupabaseUser?.id || ''

  // State
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'preferences'>('orders')
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  // Profile Form State
  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null)

  // Preferences State
  const [shippingAlerts, setShippingAlerts] = useState(true)
  const [promoAlerts, setPromoAlerts] = useState(false)
  const [savedCards, setSavedCards] = useState([
    { id: '1', brand: 'Visa', last4: '4242', exp: '12/28', isDefault: true },
  ])
  const [activeModal, setActiveModal] = useState<'none' | 'addCard' | 'privacy'>('none')
  const [newCardNumber, setNewCardNumber] = useState('')
  const [newCardExp, setNewCardExp] = useState('')

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<OrderItem | null>(null)

  // 1. Auth Guard
  useEffect(() => {
    if (!authLoading && !effectiveUser) {
      console.log('[AccountClient] Unauthenticated, redirecting to /login')
      router.push('/login')
    }
  }, [authLoading, effectiveUser, router])

  // 2. Load User Profile and Real Firebase Orders
  useEffect(() => {
    if (effectiveUid) {
      // Load Profile
      getUserProfile(effectiveUid).then((profile) => {
        setDisplayName(profile.displayName || firebaseUser?.displayName || '')
        setPhoneNumber(profile.phoneNumber || '')
        setShippingAddress(profile.address || '')
        if (profile.notificationsEnabled !== undefined) setShippingAlerts(profile.notificationsEnabled)
      })

      // Load Real Orders from Firebase
      setLoadingOrders(true)
      getUserOrders(effectiveUid)
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            setOrders(fetched)
          } else if (initialOrders && initialOrders.length > 0) {
            // Adapt Supabase orders if any
            const adapted = initialOrders.map((o) => ({
              id: o.id,
              userId: o.user_id,
              userEmail: effectiveEmail,
              items: 'Premium Strawberry Nectar',
              quantity: o.quantity || 1,
              unitPrice: 30,
              totalPrice: o.total_price || 30,
              currency: 'INR',
              status: o.status || 'Confirmed',
              date: o.created_at || new Date().toISOString(),
              shipping: { firstName: '', lastName: '', address: '', city: '', postalCode: '' },
              paymentMethod: 'Card',
            }))
            setOrders(adapted)
          } else {
            setOrders([])
          }
        })
        .finally(() => setLoadingOrders(false))
    }
  }, [effectiveUid, firebaseUser, initialOrders, effectiveEmail])

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileSuccessMsg(null)

    try {
      // 1. Update Firebase Auth displayName
      if (firebaseUser) {
        await updateProfile(firebaseUser, { displayName: displayName.trim() })
      }

      // 2. Save to Firestore/Local
      await saveUserProfile(effectiveUid, {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: shippingAddress.trim(),
        email: effectiveEmail,
      })

      setProfileSuccessMsg('Profile updated successfully!')
      setTimeout(() => setProfileSuccessMsg(null), 3000)
    } catch (err: any) {
      console.error('[Account] Error saving profile:', err)
    } finally {
      setProfileSaving(false)
    }
  }

  // Toggle Dark Mode — delegates to ThemeContext which handles Firebase sync + CSS
  const handleToggleDarkMode = async () => {
    await toggleTheme()
  }

  // Toggle Shipping Alerts
  const handleToggleShippingAlerts = async () => {
    const nextVal = !shippingAlerts
    setShippingAlerts(nextVal)
    if (effectiveUid) {
      await saveUserProfile(effectiveUid, { notificationsEnabled: nextVal })
    }
  }

  // Add Mock Card
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault()
    const digits = newCardNumber.replace(/\D/g, '')
    if (digits.length >= 4) {
      const last4 = digits.slice(-4)
      setSavedCards(prev => [
        ...prev,
        { id: `${Date.now()}`, brand: 'Mastercard', last4, exp: newCardExp || '10/29', isDefault: false }
      ])
      setNewCardNumber('')
      setNewCardExp('')
      setActiveModal('none')
    }
  }

  // Export User Data as JSON
  const handleDownloadData = () => {
    const dataToExport = {
      user: {
        id: effectiveUid,
        email: effectiveEmail,
        displayName,
        phoneNumber,
        shippingAddress,
      },
      orders,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `juice_account_data_${effectiveUid.substring(0, 6)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Sign out handler
  const handleSignOut = async () => {
    setLoggingOut(true)
    try {
      if (firebaseUser) await firebaseLogout()
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch (e) {}
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('[AccountClient] Sign out error:', err)
      setLoggingOut(false)
    }
  }

  // Loading state
  if (authLoading && !effectiveUser) {
    return (
      <div className="min-h-screen bg-luxury-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-coral border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!effectiveUser) return null

  return (
    <div className="min-h-screen bg-luxury-black text-white relative overflow-hidden pt-32 pb-24">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-coral/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-red/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Top Header Card */}
        <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-red to-brand-coral flex items-center justify-center text-xl font-bold uppercase text-white shadow-[0_0_20px_rgba(255,107,157,0.4)]">
              {(displayName || effectiveEmail)?.[0] || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-light tracking-widest text-glow uppercase">
                  {displayName || 'My Account'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] tracking-widest uppercase bg-brand-coral/10 text-brand-coral border border-brand-coral/30">
                  Verified Member
                </span>
              </div>
              <p className="text-white/50 text-xs tracking-wider mt-1">{effectiveEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link
              href="/order"
              className="flex-1 md:flex-initial text-center px-6 py-3 rounded-full bg-brand-coral text-white font-semibold tracking-widest text-xs uppercase hover:bg-brand-red transition-all duration-300 shadow-[0_4px_14px_rgba(255,107,157,0.4)] hover:shadow-[0_8px_25px_rgba(255,107,157,0.6)] transform hover:-translate-y-0.5"
            >
              Order Juice
            </Link>
            <button
              onClick={handleSignOut}
              disabled={loggingOut}
              className="px-6 py-3 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-brand-coral font-semibold tracking-widest text-xs uppercase transition-all duration-300 disabled:opacity-50"
            >
              {loggingOut ? 'Signing out...' : 'Log Out'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 glass-panel rounded-2xl max-w-md mb-8 border border-white/10">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${
              activeTab === 'orders'
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Order History ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${
              activeTab === 'profile'
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${
              activeTab === 'preferences'
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Preferences
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-light tracking-widest uppercase text-white/90">Your Past Orders</h2>
              <span className="text-xs text-white/40 tracking-wider">Prices at ₹30 / juice</span>
            </div>

            {loadingOrders ? (
              <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-coral border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs uppercase tracking-widest text-white/50">Fetching orders from Firebase...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center text-center border border-white/10">
                <span className="text-4xl mb-4">🥤</span>
                <h3 className="text-lg font-light tracking-widest uppercase mb-2">No Active Orders Found</h3>
                <p className="text-white/40 tracking-widest uppercase text-xs mb-6 max-w-sm">
                  You haven&apos;t placed any orders yet. Experience the cold-pressed nectar today.
                </p>
                <Link
                  href="/order"
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-brand-coral to-brand-red text-white text-xs uppercase tracking-widest font-semibold shadow-[0_0_25px_rgba(255,107,157,0.4)] hover:shadow-[0_0_40px_rgba(255,107,157,0.6)] transition-all"
                >
                  Place Your First Order →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 hover:border-brand-coral/40 transition-all duration-300 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-16 rounded-2xl bg-gradient-to-tr from-brand-red/20 to-brand-coral/20 flex items-center justify-center text-2xl border border-white/10 shrink-0">
                        🍓
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-semibold tracking-wider text-white">
                            {order.items || 'Strawberry Nectar'}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 tracking-wider mt-1">
                          Ref: <span className="font-mono text-white/80">#{order.id.substring(0, 10).toUpperCase()}</span> • {new Date(order.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                        <p className="text-xs text-brand-coral tracking-wider mt-1">
                          Qty: {order.quantity || 1} bottle(s) • ₹{order.unitPrice || 30} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-white/10">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-white/40 tracking-widest uppercase">Total Paid</p>
                        <p className="text-2xl font-light text-glow-coral">₹{order.totalPrice}</p>
                      </div>

                      <button
                        onClick={() => setSelectedReceipt(order)}
                        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs uppercase tracking-widest font-medium transition-colors flex items-center gap-2 shrink-0"
                      >
                        <svg className="w-3.5 h-3.5 text-brand-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-300 max-w-2xl">
            <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10">
              <h2 className="text-xl font-light tracking-widest uppercase text-white mb-2">Personal Information</h2>
              <p className="text-xs text-white/50 tracking-wider mb-8">Update your profile information for faster checkout.</p>

              {profileSuccessMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs uppercase tracking-widest text-center font-semibold">
                  {profileSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-white/60 text-xs tracking-widest uppercase font-semibold mb-2 pl-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white focus:outline-none focus:border-brand-coral/60 transition-all font-light"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs tracking-widest uppercase font-semibold mb-2 pl-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white focus:outline-none focus:border-brand-coral/60 transition-all font-light"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs tracking-widest uppercase font-semibold mb-2 pl-2">
                    Email Address (Account ID)
                  </label>
                  <input
                    type="email"
                    value={effectiveEmail}
                    readOnly
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white/40 font-light cursor-not-allowed"
                  />
                  <p className="text-[10px] text-white/30 tracking-wider mt-1.5 pl-2">Email cannot be modified directly.</p>
                </div>

                <div>
                  <label className="block text-white/60 text-xs tracking-widest uppercase font-semibold mb-2 pl-2">
                    Default Delivery Address
                  </label>
                  <textarea
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter your street address, city, and postal code"
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white focus:outline-none focus:border-brand-coral/60 transition-all font-light resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full py-4 rounded-2xl bg-white text-black font-semibold tracking-widest text-xs uppercase hover:bg-brand-coral hover:text-white transition-all shadow-[0_0_20px_rgba(255,107,157,0.2)] disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PREFERENCES & BUTTONS */}
        {activeTab === 'preferences' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            
            {/* Dark Mode Card */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-light tracking-widest text-white uppercase mb-1">Dark Mode</h3>
                <p className="text-xs text-white/50 tracking-wider">Immersive deep luxury black aesthetic.</p>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                <span className="text-xs uppercase tracking-widest text-brand-coral font-medium">
                  {isDarkMode ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleDarkMode}
                  className="w-12 h-6 bg-brand-coral rounded-full relative shadow-[0_0_15px_rgba(255,107,157,0.4)] transition-all"
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      isDarkMode ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-light tracking-widest text-white uppercase mb-1">Notifications</h3>
                <p className="text-xs text-white/50 tracking-wider">Instant alerts on order confirmation & delivery updates.</p>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                <span className="text-xs uppercase tracking-widest text-white/70">Shipping Alerts</span>
                <button
                  type="button"
                  onClick={handleToggleShippingAlerts}
                  className={`w-12 h-6 rounded-full relative transition-all ${
                    shippingAlerts ? 'bg-brand-coral shadow-[0_0_15px_rgba(255,107,157,0.4)]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      shippingAlerts ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Payment Methods Card */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-light tracking-widest text-white uppercase">Payment Methods</h3>
                <button
                  onClick={() => setActiveModal('addCard')}
                  className="text-xs uppercase tracking-widest text-brand-coral hover:text-white transition-colors"
                >
                  + Add Card
                </button>
              </div>
              <p className="text-xs text-white/50 tracking-wider mb-6">Manage your saved payment cards securely.</p>

              <div className="space-y-3">
                {savedCards.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">💳</span>
                      <div>
                        <p className="font-semibold text-white tracking-wider">{c.brand} •••• {c.last4}</p>
                        <p className="text-[10px] text-white/40">Expires {c.exp}</p>
                      </div>
                    </div>
                    {c.isDefault && (
                      <span className="text-[9px] uppercase tracking-wider text-brand-coral border border-brand-coral/40 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy & Data Card */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-light tracking-widest text-white uppercase mb-1">Privacy & Data</h3>
                <p className="text-xs text-white/50 tracking-wider">Control your account data, permissions, and export history.</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
                <button
                  onClick={handleDownloadData}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs uppercase tracking-widest font-medium transition-colors text-center"
                >
                  Download My Data
                </button>
                <button
                  onClick={() => setActiveModal('privacy')}
                  className="py-3 px-4 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs uppercase tracking-widest font-medium transition-colors"
                >
                  Permissions
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-8 border border-white/15 shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-light tracking-widest uppercase text-white">Order Receipt</h3>
                <p className="text-xs font-mono text-brand-coral mt-0.5">#{selectedReceipt.id.substring(0, 10).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Date Placed:</span>
                <span className="text-white">{new Date(selectedReceipt.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Item:</span>
                <span className="text-white font-medium">{selectedReceipt.items || 'Strawberry Nectar'}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Quantity:</span>
                <span className="text-white">{selectedReceipt.quantity || 1} bottle(s)</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Price per Unit:</span>
                <span className="text-white">₹{selectedReceipt.unitPrice || 30}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Payment Status:</span>
                <span className="text-green-400 font-semibold uppercase">{selectedReceipt.status}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between text-sm">
                <span className="text-white font-semibold uppercase tracking-wider">Total Amount:</span>
                <span className="text-2xl font-light text-glow-coral">₹{selectedReceipt.totalPrice}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-2xl bg-white text-black font-semibold text-xs uppercase tracking-widest hover:bg-brand-coral hover:text-white transition-all"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-6 py-3 rounded-2xl bg-white/10 text-white text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CARD MODAL */}
      {activeModal === 'addCard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel max-w-md w-full rounded-3xl p-8 border border-white/15 shadow-2xl relative">
            <h3 className="text-lg font-light tracking-widest uppercase text-white mb-4">Add Demo Card</h3>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="5555 4444 3333 2222"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                  maxLength={19}
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-brand-coral"
                />
              </div>
              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="block text-white/60 text-xs uppercase tracking-wider mb-1">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={newCardExp}
                    onChange={(e) => setNewCardExp(e.target.value)}
                    maxLength={5}
                    required
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-brand-coral"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-white/60 text-xs uppercase tracking-wider mb-1">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    required
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-brand-coral"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-white text-black font-semibold text-xs uppercase tracking-widest hover:bg-brand-coral hover:text-white transition-all"
                >
                  Save Card
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-5 py-3 rounded-xl bg-white/10 text-white text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRIVACY MODAL */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel max-w-md w-full rounded-3xl p-8 border border-white/15 shadow-2xl relative">
            <h3 className="text-lg font-light tracking-widest uppercase text-white mb-2">Privacy & Permissions</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-6">
              Your account details and orders are encrypted and stored in your Firebase project. We never share your shipping address or order records with third parties.
            </p>
            <div className="space-y-3 mb-6 text-xs text-white/80">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Firebase Authentication Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Order History Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Mock Payment Sandbox Mode</span>
              </div>
            </div>
            <button
              onClick={() => setActiveModal('none')}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-xs uppercase tracking-widest hover:bg-brand-coral hover:text-white transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
