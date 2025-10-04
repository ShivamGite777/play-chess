import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthTokens } from '@/types'

interface AuthStore {
  // Auth state
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setUser: (user: User) => void
  setTokens: (tokens: AuthTokens) => void
  setAuthenticated: (authenticated: boolean) => void
  setLoading: (loading: boolean) => void
  
  // Auth actions
  login: (user: User, tokens: AuthTokens) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  
  // Token management
  getAccessToken: () => string | null
  refreshToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      
      // Actions
      setUser: (user) => set({ user }),
      
      setTokens: (tokens) => set({ tokens }),
      
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      // Auth actions
      login: (user, tokens) => set({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      }),
      
      logout: () => set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      }),
      
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null,
      })),
      
      // Token management
      getAccessToken: () => {
        const tokens = get().tokens
        return tokens?.accessToken || null
      },
      
      refreshToken: async () => {
        const tokens = get().tokens
        if (!tokens?.refreshToken) return false
        
        try {
          const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken: tokens.refreshToken,
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.tokens) {
              set({ tokens: data.tokens })
              return true
            }
          }
          
          // If refresh fails, logout
          get().logout()
          return false
        } catch (error) {
          console.error('Token refresh failed:', error)
          get().logout()
          return false
        }
      },
    }),
    {
      name: 'chess-auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)