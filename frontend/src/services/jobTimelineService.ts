import api from './api'

export interface JobTimeline {
  id:           number
  job_id:       number
  stage:        string
  stage_date:   string
  event_type:   string | null
  scheduled_at: string | null
  location:     string | null
  meeting_link: string | null
  created_at:   string
  updated_at:   string
}

export const STAGES = [
  { key: 'saved',          label: 'Saved'          },
  { key: 'applied',        label: 'Applied'        },
  { key: 'interview',      label: 'Interview'      },
  { key: 'technical_test', label: 'Technical Test' },
  { key: 'hr_interview',   label: 'HR Interview'   },
  { key: 'offer',          label: 'Offer'          },
  { key: 'rejected',       label: 'Rejected'       },
]

export const STAGE_COLORS: Record<string, { dot: string; text: string; line: string }> = {
  saved:          { dot: 'bg-slate-400  border-slate-400',  text: 'text-slate-300',   line: 'bg-primary' },
  applied:        { dot: 'bg-blue-500   border-blue-500',   text: 'text-blue-400',    line: 'bg-blue-500'      },
  interview:      { dot: 'bg-amber-500  border-amber-500',  text: 'text-amber-400',   line: 'bg-amber-500'     },
  technical_test: { dot: 'bg-purple-500 border-purple-500', text: 'text-purple-400',  line: 'bg-purple-500'    },
  hr_interview:   { dot: 'bg-cyan-500   border-cyan-500',   text: 'text-cyan-400',    line: 'bg-cyan-500'      },
  offer:          { dot: 'bg-emerald-500 border-emerald-500', text: 'text-emerald-400', line: 'bg-emerald-500' },
  rejected:       { dot: 'bg-red-500    border-red-500',    text: 'text-red-400',     line: 'bg-red-500'       },
}

export const jobTimelineService = {
  async getAll(jobId: number): Promise<JobTimeline[]> {
    const response = await api.get(`/jobs/${jobId}/timelines`)
    return response.data.data
  },

  async advance(jobId: number, stage: string, stage_date: string): Promise<JobTimeline> {
    const response = await api.post(`/jobs/${jobId}/timelines/advance`, { stage, stage_date })
    return response.data.data
  },

  async reset(jobId: number): Promise<void> {
    await api.post(`/jobs/${jobId}/timelines/reset`)
  },
}