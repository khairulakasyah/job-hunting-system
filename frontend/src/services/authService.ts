import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  name: string
  email: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    token: string
  }
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface UpdateProfileData {
  name: string
  email: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/login', credentials)
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/logout')
  },

  async getUser(): Promise<User> {
    const response = await api.get('/user')
    return response.data.data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/register', data)
    return response.data
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put('/profile', data)
    return response.data.data
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.put('/change-password', data)
  },
}