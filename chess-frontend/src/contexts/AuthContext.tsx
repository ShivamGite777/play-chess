import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthTokens, LoginCredentials, RegisterCredentials } from '../types'
import { apiClient } from '../utils/api'

interface AuthContextType {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (credentials: RegisterCredentials) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedTokens = localStorage.getItem('chess-tokens')
        const savedUser = localStorage.getItem('chess-user')
        
        if (savedTokens && savedUser) {
          const parsedTokens = JSON.parse(savedTokens)
          const parsedUser = JSON.parse(savedUser)
          
          // Verify token is still valid
          const response = await apiClient.getMe()
          if (response.success && response.data) {
            setTokens(parsedTokens)
            setUser(response.data.user)
            setIsAuthenticated(true)
            apiClient.setAccessToken(parsedTokens.accessToken)
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('chess-tokens')
            localStorage.removeItem('chess-user')
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        localStorage.removeItem('chess-tokens')
        localStorage.removeItem('chess-user')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiClient.login(credentials)
      
      if (response.success && response.data) {
        const { user, tokens } = response.data
        setUser(user)
        setTokens(tokens)
        setIsAuthenticated(true)
        apiClient.setAccessToken(tokens.accessToken)
        
        // Save to localStorage
        localStorage.setItem('chess-tokens', JSON.stringify(tokens))
        localStorage.setItem('chess-user', JSON.stringify(user))
        
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiClient.register(credentials)
      
      if (response.success && response.data) {
        const { user, tokens } = response.data
        setUser(user)
        setTokens(tokens)
        setIsAuthenticated(true)
        apiClient.setAccessToken(tokens.accessToken)
        
        // Save to localStorage
        localStorage.setItem('chess-tokens', JSON.stringify(tokens))
        localStorage.setItem('chess-user', JSON.stringify(user))
        
        return true
      }
      return false
    } catch (error) {
      console.error('Registration error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setTokens(null)
    setIsAuthenticated(false)
    apiClient.setAccessToken(null)
    
    // Clear localStorage
    localStorage.removeItem('chess-tokens')
    localStorage.removeItem('chess-user')
    
    // Call logout API
    apiClient.logout().catch(console.error)
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (prev) {
        const updated = { ...prev, ...userData }
        localStorage.setItem('chess-user', JSON.stringify(updated))
        return updated
      }
      return prev
    })
  }

  const refreshToken = async (): Promise<boolean> => {
    if (!tokens?.refreshToken) return false
    
    try {
      const response = await apiClient.refreshToken(tokens.refreshToken)
      
      if (response.success && response.data) {
        const newTokens = response.data.tokens
        setTokens(newTokens)
        apiClient.setAccessToken(newTokens.accessToken)
        localStorage.setItem('chess-tokens', JSON.stringify(newTokens))
        return true
      }
      
      // Refresh failed, logout
      logout()
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      return false
    }
  }

  // Auto-refresh token
  useEffect(() => {
    if (!tokens?.refreshToken) return

    const refreshInterval = setInterval(async () => {
      const success = await refreshToken()
      if (!success) {
        console.log('Token refresh failed, user will be logged out')
      }
    }, 30 * 60 * 1000) // Refresh every 30 minutes

    return () => clearInterval(refreshInterval)
  }, [tokens?.refreshToken])

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}