import api from './api'

export type ServiceStatus = 'ok' | 'error' | 'warning' | 'unconfigured'

export interface ServiceHealth {
  key: string
  label: string
  status: ServiceStatus
  latency_ms: number
  detail: string | null
}

export interface ServicesHealth {
  checked_at: string
  overall: 'ok' | 'degraded' | 'error'
  services: ServiceHealth[]
}

export const adminService = {
  async getServicesHealth(): Promise<ServicesHealth> {
    const response = await api.get('/admin/services')
    return response.data.data
  },
}
