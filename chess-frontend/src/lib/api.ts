import { ApiResponse, PaginatedResponse, User, Game, LobbyGame, UserStats, AuthTokens, LoginCredentials, RegisterCredentials } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

class ApiClient {
  private baseURL: string
  private accessToken: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Request failed')
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async register(credentials: RegisterCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    })
  }

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/api/auth/me')
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    })
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ tokens: AuthTokens }>> {
    return this.request('/api/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.request('/api/auth/me/stats')
  }

  async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<PaginatedResponse<any>> {
    return this.request(`/api/auth/me/game-history?limit=${limit}&offset=${offset}`)
  }

  // Game endpoints
  async getLobbyGames(limit: number = 20, offset: number = 0): Promise<PaginatedResponse<LobbyGame>> {
    return this.request(`/api/games/lobby?limit=${limit}&offset=${offset}`)
  }

  async createGame(gameData: {
    game_mode: string
    time_control: number
    increment_seconds?: number
    delay_seconds?: number
  }): Promise<ApiResponse<{ game: Game }>> {
    return this.request('/api/games/create', {
      method: 'POST',
      body: JSON.stringify(gameData),
    })
  }

  async joinGame(gameId: string): Promise<ApiResponse<{ game: Game }>> {
    return this.request(`/api/games/${gameId}/join`, {
      method: 'POST',
    })
  }

  async getGameDetails(gameId: string): Promise<ApiResponse<{
    game: Game
    timer: any
    isPlayer: boolean
    isSpectator: boolean
  }>> {
    return this.request(`/api/games/${gameId}`)
  }

  async makeMove(gameId: string, move: {
    from: string
    to: string
    promotion?: string
  }): Promise<ApiResponse<{
    move: any
    gameState: any
    timer: any
    isGameOver: boolean
  }>> {
    return this.request(`/api/games/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify(move),
    })
  }

  async resign(gameId: string): Promise<ApiResponse<{ game: Game }>> {
    return this.request(`/api/games/${gameId}/resign`, {
      method: 'POST',
    })
  }

  async offerDraw(gameId: string, action: 'offer' | 'accept' | 'decline'): Promise<ApiResponse<{ game: Game }>> {
    return this.request(`/api/games/${gameId}/draw`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
  }

  async getGameHistory(gameId: string, limit: number = 100, offset: number = 0): Promise<PaginatedResponse<any>> {
    return this.request(`/api/games/${gameId}/history?limit=${limit}&offset=${offset}`)
  }

  async getUserActiveGames(): Promise<ApiResponse<Game[]>> {
    return this.request('/api/games/my-games')
  }

  // User endpoints
  async getUserProfile(userId: string): Promise<ApiResponse<{ user: User }>> {
    return this.request(`/api/users/${userId}/profile`)
  }

  async getUserStats(userId: string): Promise<ApiResponse<UserStats>> {
    return this.request(`/api/users/${userId}/stats`)
  }

  async getUserGameHistory(userId: string, limit: number = 20, offset: number = 0): Promise<PaginatedResponse<any>> {
    return this.request(`/api/users/${userId}/game-history?limit=${limit}&offset=${offset}`)
  }

  async getLeaderboard(limit: number = 50, offset: number = 0): Promise<PaginatedResponse<User>> {
    return this.request(`/api/users/leaderboard?limit=${limit}&offset=${offset}`)
  }

  async searchUsers(username: string, limit: number = 20, offset: number = 0): Promise<PaginatedResponse<User>> {
    return this.request(`/api/users/search?username=${encodeURIComponent(username)}&limit=${limit}&offset=${offset}`)
  }

  async getUserRecentGames(userId: string, limit: number = 10): Promise<ApiResponse<any[]>> {
    return this.request(`/api/users/${userId}/recent-games?limit=${limit}`)
  }

  async getUserActiveGames(userId: string): Promise<ApiResponse<Game[]>> {
    return this.request(`/api/users/${userId}/active-games`)
  }

  async getUserGameStatsByTimeControl(userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/users/${userId}/game-stats`)
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{
    message: string
    timestamp: string
    version: string
  }>> {
    return this.request('/api/health')
  }
}

// Create global API client instance
export const apiClient = new ApiClient(API_BASE_URL)

// Hook for using API client in components
export const useApi = () => {
  return apiClient
}

// Utility function to handle API errors
export const handleApiError = (error: any) => {
  if (error.message) {
    return error.message
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  return 'An unexpected error occurred'
}