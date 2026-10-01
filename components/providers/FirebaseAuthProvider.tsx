'use client'
// components/providers/FirebaseAuthProvider.tsx
// Mounts both AuthProvider and ThemeProvider globally

import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ReactNode } from 'react'

export default function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  )
}
