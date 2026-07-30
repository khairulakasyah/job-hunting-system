import api from './api'

export interface CalendarEvent {
  id:           number
  title:        string
  start:        string
  allDay:       boolean
  extendedProps: {
    job_id:       number
    job_title:    string
    company:      string
    stage:        string
    event_type:   string
    location:     string | null
    meeting_link: string | null
    status:       string
  }
}

export interface EventFormData {
  job_id:       number
  event_type:   string
  scheduled_at: string
  stage?:       string
  stage_date?:  string
  location?:    string
  meeting_link?: string
}

export const eventService = {
  async getEvents(from: string, to: string): Promise<CalendarEvent[]> {
    const response = await api.get('/calendar/events', { params: { from, to } })
    return response.data.data
  },

  async create(data: EventFormData): Promise<CalendarEvent> {
    const response = await api.post('/calendar/events', data)
    return response.data.data
  },

  async update(id: number, data: Partial<EventFormData>): Promise<CalendarEvent> {
    const response = await api.put(`/calendar/events/${id}`, data)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/calendar/events/${id}`)
  },
}
