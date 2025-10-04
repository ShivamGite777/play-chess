'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { socketManager } from '@/lib/socket'
import { updateSoundSettings } from '@/lib/sounds'

export function Providers({ children }: { children: React.ReactNode }) {
  const { tokens, isAuthenticated, refreshToken } = useAuthStore()
  const { settings } = useSettingsStore()

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      socketManager.connect(tokens.accessToken)
    } else {
      socketManager.disconnect()
    }

    return () => {
      socketManager.disconnect()
    }
  }, [isAuthenticated, tokens?.accessToken])

  // Update sound settings when they change
  useEffect(() => {
    updateSoundSettings(settings.soundEnabled, settings.soundVolume)
  }, [settings.soundEnabled, settings.soundVolume])

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = settings.theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme

    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
  }, [settings.theme])

  // Apply font size to document
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

  // Token refresh interval
  useEffect(() => {
    if (!isAuthenticated || !tokens?.refreshToken) return

    const refreshInterval = setInterval(async () => {
      const success = await refreshToken()
      if (!success) {
        console.log('Token refresh failed, user will be logged out')
      }
    }, 30 * 60 * 1000) // Refresh every 30 minutes

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated, tokens?.refreshToken, refreshToken])

  return <>{children}</>
}