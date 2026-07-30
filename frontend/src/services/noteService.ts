import api from './api'

export interface Note {
  id:         number
  content:    string
  pinned:     boolean
  created_at: string
  updated_at: string
}

export const noteService = {
  async getNotes(jobId: number): Promise<Note[]> {
    const response = await api.get(`/jobs/${jobId}/notes`)
    return response.data.data
  },

  async create(jobId: number, content: string, pinned = false): Promise<Note> {
    const response = await api.post(`/jobs/${jobId}/notes`, { content, pinned })
    return response.data.data
  },

  async update(noteId: number, data: { content?: string; pinned?: boolean }): Promise<Note> {
    const response = await api.put(`/notes/${noteId}`, data)
    return response.data.data
  },

  async delete(noteId: number): Promise<void> {
    await api.delete(`/notes/${noteId}`)
  },
}
