import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserSettings, Theme } from '@/types'

interface SettingsStore {
  // Settings state
  settings: UserSettings
  
  // Actions
  updateSettings: (settings: Partial<UserSettings>) => void
  resetSettings: () => void
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  toggleTheme: () => void
  
  // Sound actions
  setSoundEnabled: (enabled: boolean) => void
  setSoundVolume: (volume: number) => void
  toggleSound: () => void
  
  // UI actions
  setAnimationsEnabled: (enabled: boolean) => void
  setShowCoordinates: (show: boolean) => void
  setShowMoveHistory: (show: boolean) => void
  setShowCapturedPieces: (show: boolean) => void
  setAutoFlip: (autoFlip: boolean) => void
  setHighContrast: (highContrast: boolean) => void
  setFontSize: (fontSize: 'small' | 'medium' | 'large') => void
  
  // Computed values
  getEffectiveTheme: () => 'light' | 'dark'
}

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
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      
      // Actions
      updateSettings: (newSettings) => 
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      resetSettings: () => set({ settings: defaultSettings }),
      
      // Theme actions
      setTheme: (theme) => 
        set((state) => ({
          settings: { ...state.settings, theme },
        })),
      
      toggleTheme: () => {
        const currentTheme = get().settings.theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },
      
      // Sound actions
      setSoundEnabled: (soundEnabled) => 
        set((state) => ({
          settings: { ...state.settings, soundEnabled },
        })),
      
      setSoundVolume: (soundVolume) => 
        set((state) => ({
          settings: { ...state.settings, soundVolume },
        })),
      
      toggleSound: () => {
        const currentSound = get().settings.soundEnabled
        get().setSoundEnabled(!currentSound)
      },
      
      // UI actions
      setAnimationsEnabled: (animationsEnabled) => 
        set((state) => ({
          settings: { ...state.settings, animationsEnabled },
        })),
      
      setShowCoordinates: (showCoordinates) => 
        set((state) => ({
          settings: { ...state.settings, showCoordinates },
        })),
      
      setShowMoveHistory: (showMoveHistory) => 
        set((state) => ({
          settings: { ...state.settings, showMoveHistory },
        })),
      
      setShowCapturedPieces: (showCapturedPieces) => 
        set((state) => ({
          settings: { ...state.settings, showCapturedPieces },
        })),
      
      setAutoFlip: (autoFlip) => 
        set((state) => ({
          settings: { ...state.settings, autoFlip },
        })),
      
      setHighContrast: (highContrast) => 
        set((state) => ({
          settings: { ...state.settings, highContrast },
        })),
      
      setFontSize: (fontSize) => 
        set((state) => ({
          settings: { ...state.settings, fontSize },
        })),
      
      // Computed values
      getEffectiveTheme: () => {
        const { theme } = get().settings
        
        if (theme === 'auto') {
          if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          }
          return 'light'
        }
        
        return theme
      },
    }),
    {
      name: 'chess-settings-storage',
    }
  )
)