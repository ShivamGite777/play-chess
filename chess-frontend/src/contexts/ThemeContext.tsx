import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserSettings } from '../types'

interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto'
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  toggleTheme: () => void
  getEffectiveTheme: () => 'light' | 'dark'
  settings: UserSettings
  updateSettings: (settings: Partial<UserSettings>) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const defaultSettings: UserSettings = {
  theme: 'auto',
  soundEnabled: true,
  soundVolume: 0.7,
  animationsEnabled: true,
  showCoordinates: true,
  showMoveHistory: false,
  showCapturedPieces: true,
  autoFlip: false,
  highContrast: false,
  fontSize: 'medium',
  patternOverlay: false,
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chess-settings')
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) }
        } catch {
          return defaultSettings
        }
      }
    }
    return defaultSettings
  })

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    updateSettings({ theme })
  }

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (settings.theme === 'auto') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light'
    }
    return settings.theme
  }

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      if (typeof window !== 'undefined') {
        localStorage.setItem('chess-settings', JSON.stringify(updated))
      }
      return updated
    })
  }

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme()
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
    
    // Update CSS custom properties
    const root = document.documentElement
    if (effectiveTheme === 'dark') {
      root.style.setProperty('--toast-bg', '#1F2937')
      root.style.setProperty('--toast-color', '#F9FAFB')
      root.style.setProperty('--toast-border', '#374151')
    } else {
      root.style.setProperty('--toast-bg', '#FFFFFF')
      root.style.setProperty('--toast-color', '#111827')
      root.style.setProperty('--toast-border', '#E5E7EB')
    }
  }, [settings.theme])

  // Apply font size
  useEffect(() => {
    const fontSizeClass = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    }[settings.fontSize]
    
    document.documentElement.className = fontSizeClass
  }, [settings.fontSize])

  // Apply high contrast mode
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', settings.highContrast)
  }, [settings.highContrast])

  // Apply pattern overlay for colorblind users
  useEffect(() => {
    document.documentElement.classList.toggle('pattern-overlay', settings.patternOverlay)
  }, [settings.patternOverlay])

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        const effectiveTheme = getEffectiveTheme()
        document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [settings.theme])

  return (
    <ThemeContext.Provider
      value={{
        theme: settings.theme,
        setTheme,
        toggleTheme,
        getEffectiveTheme,
        settings,
        updateSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}