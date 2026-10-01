'use client'
// contexts/AuthContext.tsx
// Firebase Auth state provider — wraps the app and exposes the current user
// to all client components via useAuth() hook.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      console.warn('[AuthProvider] Firebase is not configured — skipping auth listener.')
      setLoading(false)
      return
    }

    console.log('[AuthProvider] Attaching onAuthStateChanged listener...')
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Only treat the user as logged in if their email is verified,
        // OR if they signed in via a provider that pre-verifies (e.g. Google).
        const isEmailProvider = firebaseUser.providerData.some(
          (p) => p.providerId === 'password'
        )
        const isVerified = firebaseUser.emailVerified
        if (isEmailProvider && !isVerified) {
          console.log('[AuthProvider] User not verified, treating as signed out:', firebaseUser.email)
          setUser(null)
        } else {
          console.log('[AuthProvider] Auth state: verified user →', firebaseUser.email)
          setUser(firebaseUser)
        }
      } else {
        console.log('[AuthProvider] Auth state changed: signed out')
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      console.log('[AuthProvider] Cleaning up auth listener.')
      unsubscribe()
    }
  }, [])

  const logout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      console.log('[AuthProvider] User signed out.')
    } catch (err) {
      console.error('[AuthProvider] Sign-out error:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Use inside any client component to access the Firebase user */
export function useAuth() {
  return useContext(AuthContext)
}
