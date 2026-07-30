import api from './api'

export interface MonthlyTrend {
  month: string
  count: number
}

export interface PlatformItem {
  platform: string
  count: number
}

export interface StatusItem {
  status: string
  count: number
}

export interface UpcomingEvent {
  id: number
  job_id: number
  company_name: string
  job_title: string
  stage: string
  scheduled_at: string
  event_type: string | null
  location: string | null
  meeting_link: string | null
}

export interface ActivityItem {
  type: 'job_created' | 'event_scheduled' | 'stage_advanced'
  description: string
  status: string | null
  created_at: string
}

export interface AvgDaysPerStage {
  saved_to_applied: number | null
  applied_to_interview: number | null
  interview_to_offer: number | null
  applied_to_rejected: number | null
}

export interface PlatformSuccessItem {
  platform: string
  total: number
  offers: number
  rate: number
}

export interface WeeklyActivityItem {
  day_name: string
  count: number
}

export interface StatusDuration {
  saved: number | null
  applied: number | null
  interview: number | null
  offer: number | null
  rejected: number | null
}

export interface DashboardData {
  monthly_trends: MonthlyTrend[]
  platform_breakdown: PlatformItem[]
  status_distribution: StatusItem[]
  upcoming_events: UpcomingEvent[]
  recent_activity: ActivityItem[]
  avg_days_per_stage: AvgDaysPerStage
  success_rate: number
  platform_success: PlatformSuccessItem[]
  weekly_activity: WeeklyActivityItem[]
  status_duration: StatusDuration
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get('/dashboard')
    return response.data.data
  },

  async getAdminDashboard(): Promise<DashboardData> {
    const response = await api.get('/admin/dashboard')
    return response.data.data
  },
}
