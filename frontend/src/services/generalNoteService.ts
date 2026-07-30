import api from './api'

export interface NoteCategory {
  id:       number
  name:     string
  color:    string
  position: number
  notes:    GeneralNote[]
}

export interface GeneralNote {
  id:          number
  category_id: number
  title:       string
  content:     string | null
  position:    number
  created_at:  string
  updated_at:  string
}

export const generalNoteService = {
  async getBoard(): Promise<NoteCategory[]> {
    const response = await api.get('/notes/board')
    return response.data.data
  },

  async createCategory(data: { name: string; color: string }): Promise<NoteCategory> {
    const response = await api.post('/notes/categories', data)
    return response.data.data
  },

  async updateCategory(id: number, data: Partial<{ name: string; color: string; position: number }>): Promise<NoteCategory> {
    const response = await api.put(`/notes/categories/${id}`, data)
    return response.data.data
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/notes/categories/${id}`)
  },

  async createNote(data: { category_id: number; title: string; content?: string }): Promise<GeneralNote> {
    const response = await api.post('/notes/notes', data)
    return response.data.data
  },

  async updateNote(id: number, data: Partial<{ title: string; content: string }>): Promise<GeneralNote> {
    const response = await api.put(`/notes/notes/${id}`, data)
    return response.data.data
  },

  async moveNote(id: number, data: { category_id: number; position: number }): Promise<GeneralNote> {
    const response = await api.patch(`/notes/notes/${id}/move`, data)
    return response.data.data
  },

  async deleteNote(id: number): Promise<void> {
    await api.delete(`/notes/notes/${id}`)
  },
}
