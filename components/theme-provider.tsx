'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  theme: ThemeMode
  resolvedTheme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'telegram-theme-mode'
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyThemeClass(resolved: ThemeMode) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.setAttribute('data-theme', resolved)
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  if (stored === 'light' || stored === 'dark') return stored
  return getSystemTheme()
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light')

  useEffect(() => {
    const next = getInitialTheme()
    setThemeState(next)
    applyThemeClass(next)
  }, [])

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode)
    applyThemeClass(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, mode)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const value = useMemo(() => ({ theme, resolvedTheme: theme, setTheme, toggleTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
