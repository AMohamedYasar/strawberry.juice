'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getUserProfile, saveUserProfile } from '@/lib/ordersService'

interface ThemeContextType {
  isDarkMode: boolean
  toggleTheme: () => Promise<void>
  setTheme: (dark: boolean) => Promise<void>
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: async () => {},
  setTheme: async () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true)
  const [mounted, setMounted] = useState<boolean>(false)

  // Apply theme to document
  const applyThemeToDOM = (dark: boolean) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (dark) {
      root.setAttribute('data-theme', 'dark')
      root.classList.remove('light')
      root.classList.add('dark')
    } else {
      root.setAttribute('data-theme', 'light')
      root.classList.remove('dark')
      root.classList.add('light')
    }
  }

  // Initial load
  useEffect(() => {
    setMounted(true)
    // Check if guest or initial local theme exists
    const saved = localStorage.getItem('juice_theme_current')
    if (saved !== null) {
      const dark = saved === 'dark'
      setIsDarkMode(dark)
      applyThemeToDOM(dark)
    } else {
      applyThemeToDOM(true)
    }
  }, [])

  // Sync with user's personal Firebase profile when user changes
  useEffect(() => {
    if (!user?.uid) return

    // 1. Check user-specific localStorage first for instant load
    const userLocal = localStorage.getItem(`juice_theme_${user.uid}`)
    if (userLocal !== null) {
      const dark = userLocal === 'dark'
      setIsDarkMode(dark)
      applyThemeToDOM(dark)
    }

    // 2. Fetch from user's Firebase profile
    getUserProfile(user.uid).then((profile) => {
      if (profile.darkMode !== undefined) {
        setIsDarkMode(profile.darkMode)
        applyThemeToDOM(profile.darkMode)
        localStorage.setItem(`juice_theme_${user.uid}`, profile.darkMode ? 'dark' : 'light')
        localStorage.setItem('juice_theme_current', profile.darkMode ? 'dark' : 'light')
      }
    })
  }, [user?.uid])

  const setTheme = async (dark: boolean) => {
    setIsDarkMode(dark)
    applyThemeToDOM(dark)

    // Save locally
    localStorage.setItem('juice_theme_current', dark ? 'dark' : 'light')
    if (user?.uid) {
      localStorage.setItem(`juice_theme_${user.uid}`, dark ? 'dark' : 'light')
      // Persist to user's Firebase profile
      try {
        await saveUserProfile(user.uid, { darkMode: dark })
      } catch (err) {
        console.warn('[ThemeContext] Error syncing theme to Firebase:', err)
      }
    }
  }

  const toggleTheme = async () => {
    await setTheme(!isDarkMode)
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
