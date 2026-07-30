import api from './api'

export interface Job {
  id:              number
  user_id:         number
  company_name:    string
  job_title:       string
  location:        string
  url:             string
  job_description: string
  salary:          string
  job_platform:    string
  status:          'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  active_status:   number
  created_at:      string
  updated_at:      string
  applied_date: string | null
}

export interface JobFormData {
  company_name:    string
  job_title:       string
  location:        string
  url:             string
  job_description: string
  salary:          string
  job_platform:    string
  status:          'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  applied_date:    string
}

export interface PaginatedJobs {
  data:         Job[]
  current_page: number
  last_page:    number
  per_page:     number
  total:        number
}

export interface JobStats {
  total:     number
  applied:   number
  interview: number
  offer:     number
  rejected:  number
}

export interface ScrapedJob {
  job_title:          string
  company_name:       string
  platform:           string
  location:           string
  salary_range:       string
  working_type:       string
  job_scope:          string
  skill_requirements: string
  benefits:           string
  source_url:         string
}


export const jobService = {
  async getAll(page = 1, search = '', status = '', limit?: number, platform?: string, date_from?: string, date_to?: string, perPage = 10): Promise<PaginatedJobs> {
    const params = new URLSearchParams()
    params.append('page', String(page))
    params.append('per_page', String(perPage))
    if (search) params.append('search', search)
    if (status) params.append('status', status)
    if (limit) params.append('limit', String(limit))
    if (platform) params.append('platform', platform)
    if (date_from) params.append('date_from', date_from)
    if (date_to) params.append('date_to', date_to)
    const response = await api.get(`/jobs?${params.toString()}`)
    return response.data.data
  },

  async getKanban(): Promise<Job[]> {
    const response = await api.get('/jobs/kanban')
    return response.data.data
  },

  async updateStatus(id: number, status: string): Promise<void> {
    await api.patch(`/jobs/${id}/status`, { status })
  },

  async getOne(id: number): Promise<Job> {
    const response = await api.get(`/jobs/${id}`)
    return response.data.data
  },

  async create(data: JobFormData): Promise<Job> {
    const response = await api.post('/jobs', data)
    return response.data.data
  },

  async update(id: number, data: JobFormData): Promise<Job> {
    const response = await api.put(`/jobs/${id}`, data)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/jobs/${id}`)
  },

  async getStats(): Promise<JobStats> {
    const response = await api.get('/jobs/stats')
    return response.data.data
  },

  async getPlatforms(): Promise<string[]> {
    const response = await api.get('/jobs/platforms')
    return response.data.data
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await api.post('/jobs/bulk-delete', { ids })
  },

  async bulkUpdateStatus(ids: number[], status: string): Promise<void> {
    await api.patch('/jobs/bulk-status', { ids, status })
  },

  async exportCsv(): Promise<Blob> {
    const response = await api.get('/jobs/export', { responseType: 'blob' })
    return response.data
  },

  async scrape(url: string): Promise<ScrapedJob> {
    const response = await api.post('/scrape', { url })
    return response.data.data
  },
}
