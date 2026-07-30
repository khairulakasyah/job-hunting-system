import api from './api'

export interface SearchResultJob {
  id: number
  company_name: string
  job_title: string
  status: string
}

export interface SearchResultNote {
  id: number
  title: string
  content: string | null
  category_id: number
}

export interface SearchResultTemplate {
  id: number
  name: string
  subject: string
}

export interface SearchResults {
  jobs: SearchResultJob[]
  notes: SearchResultNote[]
  templates: SearchResultTemplate[]
}

export const searchService = {
  async search(q: string): Promise<SearchResults> {
    const response = await api.get('/search', { params: { q } })
    return response.data.data
  },
}
