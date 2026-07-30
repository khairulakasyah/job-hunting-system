import api from './api'

export interface Attachment {
  id:         number
  file_name:  string
  mime_type:  string
  file_size:  number
  created_at: string
}

export const fileService = {
  async getAttachments(jobId: number): Promise<Attachment[]> {
    const response = await api.get(`/jobs/${jobId}/attachments`)
    return response.data.data
  },

  async upload(jobId: number, file: File): Promise<Attachment> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`/jobs/${jobId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  getDownloadUrl(id: number): string {
    return `${api.defaults.baseURL}/attachments/${id}`
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/attachments/${id}`)
  },
}
