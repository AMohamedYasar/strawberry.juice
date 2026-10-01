'use client'
// components/AuthForm.tsx
// Full Firebase Authentication: email/password + Google sign-in
// Email verification enforced for email/password sign-ups.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase'

// ─── Firebase error code → user-friendly message ────────────────────
function firebaseErrorMessage(code: string, message: string): string {
  const prefix = code ? `[${code}] ` : ''
  switch (code) {
    case 'auth/invalid-credential':
      return `${prefix}Invalid login credentials. Either the email is not registered or the password is incorrect.`
    case 'auth/wrong-password':
      return `${prefix}Incorrect password. Please verify and try again.`
    case 'auth/user-not-found':
      return `${prefix}No account exists with this email address. Please register first.`
    case 'auth/invalid-email':
      return `${prefix}Invalid email format. Please check your email address.`
    case 'auth/user-disabled':
      return `${prefix}This account has been disabled. Please contact support.`
    case 'auth/too-many-requests':
      return `${prefix}Access to this account has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.`
    case 'auth/email-already-in-use':
      return `${prefix}This email address is already in use by another account. Please sign in instead.`
    case 'auth/weak-password':
      return `${prefix}Password should be at least 8 characters long.`
    case 'auth/operation-not-allowed':
      return `${prefix}This sign-in provider is not enabled in Firebase Console. Go to Authentication → Sign-in method to enable it.`
    case 'auth/popup-closed-by-user':
      return `${prefix}Sign-in popup was closed before completing. Please try again.`
    case 'auth/popup-blocked':
      return `${prefix}Popup was blocked by your browser. Please allow popups for localhost / this domain and retry.`
    case 'auth/cancelled-popup-request':
      return `${prefix}Previous popup request was cancelled. Please try again.`
    case 'auth/network-request-failed':
      return `${prefix}Network error. Please check your internet connection.`
    case 'auth/unauthorized-domain':
      return `${prefix}Domain not authorized in Firebase Console. Add localhost under Authentication → Settings → Authorized domains.`
    case 'auth/invalid-api-key':
      return `${prefix}Invalid Firebase API key in .env.local. Please check your configuration.`
    default:
      return prefix ? `${prefix}${message}` : (message || 'Authentication failed. Please try again.')
  }
}

// ─── Verification-pending screen ────────────────────────────────────
function VerificationPendingScreen({
  email,
  onResend,
  onBackToLogin,
  resendStatus,
}: {
  email: string
  onResend: () => Promise<void>
  onBackToLogin: () => void
  resendStatus: 'idle' | 'sending' | 'sent' | 'error'
}) {
  return (
    <div className="animate-in flex-1 flex flex-col w-full justify-center gap-6 max-w-lg mx-auto glass-panel p-12 rounded-3xl relative z-10 m-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)] text-center">
      {/* Mail icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-brand-coral/10 border border-brand-coral/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,107,157,0.2)]">
          <svg className="w-10 h-10 text-brand-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-light tracking-widest text-glow uppercase mb-3">
          Check Your Email
        </h1>
        <p className="text-white/60 text-sm font-light leading-relaxed tracking-wider">
          A verification link has been sent to
        </p>
        <p className="text-brand-coral font-semibold tracking-widest text-sm mt-1 break-all">
          {email}
        </p>
        <p className="text-white/50 text-xs mt-4 leading-relaxed tracking-wider">
          Please click the link in your email to verify your account before signing in.
          Check your spam folder if you don&apos;t see it.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
        {/* Resend button */}
        <button
          type="button"
          onClick={onResend}
          disabled={resendStatus === 'sending' || resendStatus === 'sent'}
          className="w-full relative rounded-2xl px-6 py-4 bg-white/5 border border-white/10 text-white font-semibold tracking-[0.15em] text-xs uppercase hover:bg-white/10 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendStatus === 'sending' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </span>
          ) : resendStatus === 'sent' ? (
            '✓ Verification Email Sent'
          ) : (
            'Resend Verification Email'
          )}
        </button>
        {resendStatus === 'error' && (
          <p className="text-brand-red text-xs tracking-widest uppercase text-center">
            Failed to resend. Please try again.
          </p>
        )}

        {/* Back to sign in */}
        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full mt-1 text-xs tracking-widest text-white/40 uppercase hover:text-white transition-colors py-2"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  )
}

// ─── Main AuthForm ───────────────────────────────────────────────────
export default function AuthForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Email verification states
  const [verificationPending, setVerificationPending] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const router = useRouter()

  // ── Watch auth state: redirect ONLY if email is verified (or Google user) ──
  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) return

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        console.log('[AuthForm] Verified user authenticated →', user.email)
        router.refresh()
        router.push(redirectTo)
      }
    })
    return () => unsubscribe()
  }, [redirectTo, router])

  // ── Resend verification email ────────────────────────────────────────
  const handleResendVerification = async () => {
    if (!auth?.currentUser) return
    setResendStatus('sending')
    try {
      await sendEmailVerification(auth.currentUser)
      setResendStatus('sent')
      // Reset to idle after 5s so they can send again if needed
      setTimeout(() => setResendStatus('idle'), 5000)
    } catch (err) {
      console.error('[Auth] Resend verification error:', err)
      setResendStatus('error')
      setTimeout(() => setResendStatus('idle'), 4000)
    }
  }

  // ── Back to login from verification screen ───────────────────────────
  const handleBackToLogin = async () => {
    // Sign out the unverified user so the form is clean
    if (auth) {
      try { await signOut(auth) } catch (_) {}
    }
    setVerificationPending(false)
    setPendingEmail('')
    setResendStatus('idle')
    setIsLogin(true)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
  }

  // ── Email / Password handler ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!email || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (!isFirebaseConfigured() || !auth) {
      setError('Authentication service is not configured. Please add your Firebase credentials to .env.local.')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        // ── SIGN IN ──────────────────────────────────────────────────
        console.log('[Auth] signInWithEmailAndPassword →', email)
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        if (!user.emailVerified) {
          // Block unverified users — show resend screen
          console.warn('[Auth] Sign-in blocked: email not verified for', user.email)
          setPendingEmail(user.email ?? email)
          setVerificationPending(true)
          setLoading(false)
          return
        }

        console.log('[Auth] Sign-in success (verified):', user.email)
        router.refresh()
        router.push(redirectTo)

      } else {
        // ── REGISTER ─────────────────────────────────────────────────
        if (password.length < 8) {
          throw Object.assign(new Error('Password must be at least 8 characters.'), { code: 'auth/weak-password' })
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        console.log('[Auth] createUserWithEmailAndPassword →', email)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        console.log('[Auth] Account created:', user.email)

        // Send verification email
        await sendEmailVerification(user)
        console.log('[Auth] Verification email sent to:', user.email)

        // Store email for the resend screen, then sign the user out
        // so they cannot access protected routes until verified
        const registeredEmail = user.email ?? email
        await signOut(auth)

        // Show verification-pending screen instead of redirecting to app
        setPendingEmail(registeredEmail)
        setVerificationPending(true)
      }
    } catch (err: any) {
      const code: string = err?.code ?? ''
      const msg: string = err?.message ?? ''
      console.error('[Auth] Error code:', code)
      console.error('[Auth] Error message:', msg)
      setError(firebaseErrorMessage(code, msg))
    } finally {
      setLoading(false)
    }
  }

  // ── Google Sign-In handler ────────────────────────────────────────────
  // Google accounts are always pre-verified by Google — no email check needed.
  const handleGoogleLogin = async () => {
    setError(null)
    setGoogleLoading(true)

    if (!isFirebaseConfigured() || !auth) {
      setError('Google sign-in is not configured. Add your Firebase credentials to .env.local.')
      setGoogleLoading(false)
      return
    }

    try {
      console.log('[Google Auth] Opening Google sign-in popup...')
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      provider.setCustomParameters({ prompt: 'select_account' })

      const result = await signInWithPopup(auth, provider)
      console.log('[Google Auth] signInWithPopup success:', result.user.email)
      router.refresh()
      router.push(redirectTo)

    } catch (err: any) {
      const code: string = err?.code ?? ''
      const msg: string = err?.message ?? ''
      console.error('[Google Auth] Error code:', code)
      console.error('[Google Auth] Error message:', msg)
      setError(firebaseErrorMessage(code, msg))
      setGoogleLoading(false)
    }
  }

  const anyLoading = loading || googleLoading

  // ── Show verification-pending screen ─────────────────────────────────
  if (verificationPending) {
    return (
      <VerificationPendingScreen
        email={pendingEmail}
        onResend={handleResendVerification}
        onBackToLogin={handleBackToLogin}
        resendStatus={resendStatus}
      />
    )
  }

  // ── Main form ────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="animate-in flex-1 flex flex-col w-full justify-center gap-6 max-w-lg mx-auto glass-panel p-12 rounded-3xl relative z-10 m-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
    >
      <h1 className="text-4xl text-center font-light tracking-widest text-glow mb-2 uppercase">
        {isLogin ? 'Sign In' : 'Create Account'}
      </h1>

      {/* Error & Success Messages */}
      <div className="min-h-10 flex items-center justify-center">
        {error && (
          <div className="text-brand-red text-xs tracking-widest uppercase font-semibold animate-in fade-in slide-in-from-top-2 text-center px-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-400 text-xs tracking-widest uppercase font-semibold animate-in fade-in slide-in-from-top-2 text-center">
            {success}
          </div>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label className="text-white/60 text-xs tracking-widest uppercase font-semibold pl-4" htmlFor="email">
          Email Address
        </label>
        <input
          className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white focus:outline-none focus:border-brand-coral/60 transition-all duration-300 focus:bg-white/10 font-light"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={anyLoading}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex justify-between items-center pl-4 pr-2">
          <label className="text-white/60 text-xs tracking-widest uppercase font-semibold" htmlFor="password">
            Password
          </label>
          {isLogin && (
            <a href="#" className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest transition-colors">
              Forgot?
            </a>
          )}
        </div>
        <div className="relative flex items-center">
          <input
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 pr-12 text-white focus:outline-none focus:border-brand-coral/60 transition-all duration-300 focus:bg-white/10 font-light"
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={anyLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 text-white/40 hover:text-white transition-colors p-1"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Confirm Password (Register only) */}
      {!isLogin && (
        <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <label className="text-white/60 text-xs tracking-widest uppercase font-semibold pl-4" htmlFor="confirm_password">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <input
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 pr-12 text-white focus:outline-none focus:border-brand-coral/60 transition-all duration-300 focus:bg-white/10 font-light"
              id="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              name="confirm_password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required={!isLogin}
              disabled={anyLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-4 text-white/40 hover:text-white transition-colors p-1"
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-white/10">

        {/* Email/Password submit button */}
        <button
          type="submit"
          disabled={anyLoading}
          className="w-full relative rounded-2xl px-6 py-5 bg-white text-black font-semibold tracking-[0.2em] text-xs md:text-sm uppercase overflow-hidden group shadow-[0_0_20px_rgba(255,107,157,0.2)] hover:shadow-[0_0_40px_rgba(255,107,157,0.5)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-coral to-brand-red translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
          <span className="relative z-10 group-hover:text-white transition-colors duration-500 flex items-center justify-center gap-2">
            {loading ? (
              <span className="w-4 h-4 border-2 border-black group-hover:border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              'Access Account'
            ) : (
              'Create Account'
            )}
          </span>
        </button>

        <div className="flex items-center gap-4 my-2 opacity-50">
          <div className="h-[1px] flex-1 bg-white" />
          <span className="text-[10px] tracking-widest uppercase">Or</span>
          <div className="h-[1px] flex-1 bg-white" />
        </div>

        {/* Google sign-in button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={anyLoading}
          className="w-full flex items-center justify-center gap-3 rounded-2xl px-6 py-4 bg-white/5 border border-white/10 text-white font-semibold tracking-[0.1em] text-xs uppercase hover:bg-white/10 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Google
        </button>

        {/* Toggle Login / Register */}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
            setSuccess(null)
          }}
          disabled={anyLoading}
          className="w-full mt-2 text-xs tracking-widest text-white/40 uppercase hover:text-white transition-colors py-2 disabled:opacity-50"
        >
          {isLogin ? 'New to Juice Co? Register' : 'Already a member? Sign In'}
        </button>
      </div>
    </form>
  )
}
