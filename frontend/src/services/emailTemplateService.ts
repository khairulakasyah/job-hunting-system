import api from './api'

export interface EmailTemplate {
  id:         number
  name:       string
  subject:    string
  body:       string
  variables:  string[] | null
  created_at: string
  updated_at: string
}

export interface EmailTemplateForm {
  name:      string
  subject:   string
  body:      string
  variables?: string[]
}

export const emailTemplateService = {
  async getAll(): Promise<EmailTemplate[]> {
    const response = await api.get('/email-templates')
    return response.data.data
  },

  async getOne(id: number): Promise<EmailTemplate> {
    const response = await api.get(`/email-templates/${id}`)
    return response.data.data
  },

  async create(data: EmailTemplateForm): Promise<EmailTemplate> {
    const response = await api.post('/email-templates', data)
    return response.data.data
  },

  async update(id: number, data: Partial<EmailTemplateForm>): Promise<EmailTemplate> {
    const response = await api.put(`/email-templates/${id}`, data)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/email-templates/${id}`)
  },
}
