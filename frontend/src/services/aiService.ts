import api from './api'

export const aiService = {
  async generateCoverLetter(jobId: number): Promise<string> {
    const response = await api.post('/ai/cover-letter', { job_id: jobId })
    return response.data.data.cover_letter
  },
}
