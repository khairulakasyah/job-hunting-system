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
  job_platform:    'linkedin' | 'indeed' | 'jobstreet' | 'hiredly'
  status:          'applied' | 'interview' | 'offer' | 'rejected'
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
  job_platform:    'linkedin' | 'indeed' | 'jobstreet' | 'hiredly'
  status:          'applied' | 'interview' | 'offer' | 'rejected'
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
//   async getAll(page = 1, search = '', status = ''): Promise<PaginatedJobs> {
//     const params = new URLSearchParams()
//     params.append('page', String(page))
//     if (search) params.append('search', search)
//     if (status) params.append('status', status)
//     const response = await api.get(`/jobs?${params.toString()}`)
//     return response.data.data
//   },

  async getAll(page = 1, search = '', status = '', limit?: number): Promise<PaginatedJobs> {
    const params = new URLSearchParams()
    params.append('page', String(page))
    if (search) params.append('search', search)
    if (status) params.append('status', status)
    if (limit) params.append('limit', String(limit))
    const response = await api.get(`/jobs?${params.toString()}`)
    return response.data.data
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

  async scrape(url: string): Promise<ScrapedJob> {
    const response = await api.post('/scrape', { url })
    return response.data.data
  },
}