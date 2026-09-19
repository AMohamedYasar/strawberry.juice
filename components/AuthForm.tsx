'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    // Basic Validation
    if (!email || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        console.log('[Auth] Attempting sign in for:', email)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (signInError) {
          console.error('[Auth] Sign in error:', signInError)
          throw signInError
        }

        console.log('[Auth] Sign in successful, redirecting to:', redirectTo)
        setTimeout(() => {
          router.refresh()
          router.push(redirectTo)
        }, 300)
      } else {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        console.log('[Auth] Attempting sign up for:', email)
        console.log('[Auth] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          console.error('[Auth] Sign up error:', signUpError)
          console.error('[Auth] Error name:', signUpError.name)
          console.error('[Auth] Error message:', signUpError.message)
          console.error('[Auth] Error status:', signUpError.status)
          throw signUpError
        }

        console.log('[Auth] Sign up response data:', data)

        if (data?.session) {
          // Immediately logged in (email confirmation disabled)
          console.log('[Auth] Session created immediately, redirecting...')
          setTimeout(() => {
            router.refresh()
            router.push(redirectTo)
          }, 300)
        } else {
          // Email confirmation required
          console.log('[Auth] Email confirmation required. User:', data?.user)
          setSuccess('Account created! Please check your email to verify your account.')
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setIsLogin(true)
        }
      }
    } catch (err: any) {
      // Surface the real error clearly
      const isFetchError = err instanceof TypeError && err.message === 'Failed to fetch'
      if (isFetchError) {
        console.error('[Auth] Network error — cannot reach Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.error('[Auth] This usually means the Supabase project is paused or the URL is incorrect.')
        setError('Cannot connect to authentication server. The project may be paused. Check your Supabase dashboard.')
      } else {
        console.error('[Auth] Caught error:', err)
        setError(err.message || 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-in flex-1 flex flex-col w-full justify-center gap-6 max-w-lg mx-auto glass-panel p-12 rounded-3xl relative z-10 m-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
      <h1 className="text-4xl text-center font-light tracking-widest text-glow mb-2 uppercase">
        {isLogin ? 'Sign In' : 'Create Account'}
      </h1>
      
      {/* Error & Success Messages */}
      <div className="h-10 flex items-center justify-center">
        {error && (
          <div className="text-brand-red text-xs tracking-widest uppercase font-semibold animate-in fade-in slide-in-from-top-2 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-400 text-xs tracking-widest uppercase font-semibold animate-in fade-in slide-in-from-top-2 text-center">
            {success}
          </div>
        )}
      </div>
        
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
          disabled={loading}
        />
      </div>

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
        <input
          className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white focus:outline-none focus:border-brand-coral/60 transition-all duration-300 focus:bg-white/10 font-light"
          id="password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
        />
      </div>

      {!isLogin && (
        <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <label className="text-white/60 text-xs tracking-widest uppercase font-semibold pl-4" htmlFor="confirm_password">
            Confirm Password
          </label>
          <input
            className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white focus:outline-none focus:border-brand-coral/60 transition-all duration-300 focus:bg-white/10 font-light"
            id="confirm_password"
            type="password"
            name="confirm_password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required={!isLogin}
            disabled={loading}
          />
        </div>
      )}

      <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-white/10">
        <button
          type="submit"
          disabled={loading}
          className="w-full relative rounded-2xl px-6 py-5 bg-white text-black font-semibold tracking-[0.2em] text-xs md:text-sm uppercase overflow-hidden group shadow-[0_0_20px_rgba(255,107,157,0.2)] hover:shadow-[0_0_40px_rgba(255,107,157,0.5)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-coral to-brand-red translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
          <span className="relative z-10 group-hover:text-white transition-colors duration-500 flex items-center justify-center gap-2">
            {loading ? (
              <span className="w-4 h-4 border-2 border-black group-hover:border-white border-t-transparent group-hover:border-t-transparent rounded-full animate-spin transition-colors" />
            ) : isLogin ? (
              'Access Account'
            ) : (
              'Create Account'
            )}
          </span>
        </button>

        <div className="flex items-center gap-4 my-2 opacity-50">
          <div className="h-[1px] flex-1 bg-white"></div>
          <span className="text-[10px] tracking-widest uppercase">Or</span>
          <div className="h-[1px] flex-1 bg-white"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-2xl px-6 py-4 bg-white/5 border border-white/10 text-white font-semibold tracking-[0.1em] text-xs uppercase hover:bg-white/10 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
            setSuccess(null)
          }}
          disabled={loading}
          className="w-full mt-2 text-xs tracking-widest text-white/40 uppercase hover:text-white transition-colors py-2 disabled:opacity-50"
        >
          {isLogin ? "New to Juice Co? Register" : "Already a member? Sign In"}
        </button>
      </div>
    </form>
  )
}
