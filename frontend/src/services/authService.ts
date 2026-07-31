import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  name: string
  email: string
  is_admin?: boolean
  email_verified_at?: string | null
  resume_url?: string | null
  portfolio_url?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  preferred_platform?: string | null
  preferred_location?: string | null
  salary_expectation?: string | null
  target_role?: string | null
  onboarding_completed?: boolean
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
  resume_url?: string | null
  portfolio_url?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  preferred_platform?: string | null
  preferred_location?: string | null
  salary_expectation?: string | null
  target_role?: string | null
  onboarding_completed?: boolean
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export interface ResetPasswordData {
  token: string
  email: string
  password: string
  password_confirmation: string
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

  async forgotPassword(email: string): Promise<void> {
    await api.post('/forgot-password', { email })
  },

  async resetPassword(data: ResetPasswordData): Promise<void> {
    await api.post('/reset-password', data)
  },

  async resendVerificationEmail(): Promise<void> {
    await api.post('/email/verification-notification')
  },
}