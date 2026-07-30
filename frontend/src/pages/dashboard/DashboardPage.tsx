import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { Briefcase, Clock, Trophy, XCircle, LayoutDashboard, Calendar, ExternalLink, TrendingUp, BarChart3 } from 'lucide-react'
import { Button, Card, CardHeader, CardBody } from '@/components/ui'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import { jobService, JobStats, Job } from '@/services/jobService'
import { dashboardService, DashboardData } from '@/services/dashboardService'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Link } from 'react-router-dom'

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0A66C2',
  indeed: '#003A9B',
  jobstreet: '#FF6B00',
  hiredly: '#00BFA5',
}

const ACTIVITY_ICONS: Record<string, string> = {
  job_created: 'bg-emerald-500',
  stage_advanced: 'bg-amber-500',
  event_scheduled: 'bg-orbit-primary',
}

const ACTIVITY_LABELS: Record<string, string> = {
  job_created: 'Added',
  stage_advanced: 'Moved',
  event_scheduled: 'Scheduled',
}

function formatMonth(ym: string): string {
  const d = new Date(ym + '-01')
  return d.toLocaleDateString('en-US', { month: 'short' })
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-orbit-surface2 border border-orbit-border rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400 capitalize">{p.name}</span>
          <span className="text-slate-100 font-semibold ml-auto">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [dashData, setDashData] = useState<DashboardData | null>(null)

  const now = new Date()
  const greeting =
    now.getHours() < 12 ? 'Good morning' :
      now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const [stats, setStats] = useState<JobStats | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await jobService.getAll(1, '', '', 5)
      setJobs(data.data)
    } catch {
      setError('Failed to load jobs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    jobService.getStats().then(setStats).catch(() => {})
    dashboardService.getDashboard().then(setDashData).catch(() => {})
  }, [fetchJobs])

  const stageLabels: Record<string, string> = {
    saved_to_applied: 'Saved \u2192 Applied',
    applied_to_interview: 'Applied \u2192 Interview',
    interview_to_offer: 'Interview \u2192 Offer',
    applied_to_rejected: 'Applied \u2192 Rejected',
  }

  const platformData = useMemo(() =>
    (dashData?.platform_breakdown ?? []).map(p => ({
      name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
      value: p.count,
      color: PLATFORM_COLORS[p.platform] ?? '#64748B',
    })), [dashData?.platform_breakdown])

  const trendData = useMemo(() =>
    (dashData?.monthly_trends ?? []).map(t => ({
      month: formatMonth(t.month),
      applications: t.count,
    })), [dashData?.monthly_trends])

  const stageData = useMemo(() =>
    Object.entries(dashData?.avg_days_per_stage ?? {}).map(([key, val]) => ({
      stage: stageLabels[key] ?? key,
      days: val ?? 0,
      color: key === 'applied_to_rejected' ? '#EF4444' : '#4F46E5',
    })).filter(d => d.days > 0), [dashData?.avg_days_per_stage])

  const weeklyData = useMemo(() =>
    (dashData?.weekly_activity ?? []).map(w => ({
      day: w.day_name,
      actions: w.count,
    })), [dashData?.weekly_activity])

  const platformSuccessData = useMemo(() =>
    (dashData?.platform_success ?? []).map(p => ({
      platform: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
      total: p.total,
      offers: p.offers,
      rate: p.rate,
      color: PLATFORM_COLORS[p.platform] ?? '#64748B',
    })), [dashData?.platform_success])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {greeting}, {user?.name ?? 'there'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{dateStr}</p>
        </div>
      </motion.div>

      {/* Job Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Jobs', value: stats?.total ?? 0, icon: <Briefcase className="w-5 h-5" />, color: 'text-orbit-primary-light', bg: 'bg-orbit-primary/10', border: 'border-orbit-primary/20' },
          { label: 'Applied', value: stats?.applied ?? 0, icon: <LayoutDashboard className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Interview', value: stats?.interview ?? 0, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Offer', value: stats?.offer ?? 0, icon: <Trophy className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Rejected', value: stats?.rejected ?? 0, icon: <XCircle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          { label: 'Success Rate', value: dashData ? `${dashData.success_rate}%` : 0, icon: <TrendingUp className="w-5 h-5" />, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-orbit-surface border ${card.border} rounded-xl p-5 flex items-center gap-4`}
          >
            <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.color} flex items-center justify-center flex-shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                {stats || card.label === 'Success Rate' ? card.value : <span className="w-8 h-6 bg-orbit-surface2 rounded animate-pulse inline-block" />}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insights row: Avg time per stage + Weekly activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Average Time per Stage */}
        <Card>
          <CardHeader title="Average Time per Stage" subtitle="Days between status transitions" />
          <CardBody className="pt-2">
            {stageData.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-xs text-slate-600">
                Not enough data yet
              </div>
            ) : (
              <div className="space-y-4">
                {stageData.map(item => {
                  const maxDays = Math.max(...stageData.map(d => d.days), 1)
                  return (
                    <div key={item.stage} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-36 flex-shrink-0">{item.stage}</span>
                      <div className="flex-1 h-5 bg-orbit-surface3 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.days / maxDays) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full flex items-center justify-end pr-2"
                          style={{ background: item.color, minWidth: item.days > 0 ? '40px' : '0' }}
                        >
                          {item.days > 0 && (
                            <span className="text-[10px] text-white font-semibold">{item.days}d</span>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader title="Weekly Activity" subtitle="Status changes per day of week" />
          <CardBody className="pt-2">
            {weeklyData.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-xs text-slate-600">
                No activity data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="actions" name="Actions" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((_, i) => (
                      <Cell key={i} fill="#4F46E5" fillOpacity={0.7 + (i / weeklyData.length) * 0.3} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Application Trends — takes 2/3 */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Application Trends"
            subtitle="Applications per month"
          />
          <CardBody className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="grad-apps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="applications" name="Applications" stroke="#4F46E5" strokeWidth={2} fill="url(#grad-apps)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            {trendData.length > 0 && (
              <div className="flex items-center gap-4 mt-2 pt-3 border-t border-orbit-border">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-3 h-0.5 bg-orbit-primary rounded" />
                  Applications
                </div>
                <div className="ml-auto text-xs text-slate-600">
                  Last month: <span className="text-slate-200 font-semibold">{trendData[trendData.length - 1]?.applications ?? 0}</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Jobs by Platform — takes 1/3 */}
        <Card>
          <CardHeader title="Jobs by Platform" subtitle="Where you're applying" />
          <CardBody className="pt-2">
            {platformData.length === 0 ? (
              <div className="flex items-center justify-center h-[160px] text-xs text-slate-600">
                No data yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%" cy="50%"
                      innerRadius={44} outerRadius={62}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {platformData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 mt-2">
                  {platformData.map(item => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-xs text-slate-400 flex-1">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-orbit-surface3 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(item.value / Math.max(...platformData.map(d => d.value))) * 100}%`, background: item.color }} />
                        </div>
                        <span className="text-xs text-slate-300 w-8 text-right">{item.value}</span>
                      </div>
                    </div>
                  ))}
                  {/* Platform success rates */}
                  {platformSuccessData.some(p => p.offers > 0) && (
                    <div className="pt-2 mt-2 border-t border-orbit-border">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Success Rate</p>
                      {platformSuccessData.filter(p => p.total > 0).map(p => (
                        <div key={p.platform} className="flex items-center gap-2 text-xs mb-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                          <span className="text-slate-400 w-20 truncate">{p.platform}</span>
                          <div className="flex-1 h-1.5 bg-orbit-surface3 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${p.rate}%`, background: p.color === '#FF6B00' ? '#4F46E5' : p.color }} />
                          </div>
                          <span className="text-slate-300 w-14 text-right">{p.offers}/{p.total}</span>
                          <span className="text-slate-300 w-10 text-right font-medium">{p.rate}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Bottom row: Job Applications + Events/Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Job Applications */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent Job Applications"
            subtitle={loading ? 'Loading...' : `${jobs.length} recent applications`}
            actions={
              <Link to="/jobs">
                <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3 h-3" />} iconPosition="right">
                  View all
                </Button>
              </Link>
            }
          />
          <CardBody className="p-0 pt-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-orbit-border">
                    {['COMPANY', 'JOB TITLE', 'DATE', 'PLATFORM', 'STATUS'].map(col => (
                      <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 pb-3">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orbit-border">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-4 w-28 bg-orbit-surface2 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-36 bg-orbit-surface2 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-20 bg-orbit-surface2 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-20 bg-orbit-surface2 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-6 w-20 bg-orbit-surface2 rounded-full" /></td>
                      </tr>
                    ))
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500 text-sm">
                        {error || 'No recent job applications found.'}
                      </td>
                    </tr>
                  ) : (
                    jobs.slice(0, 5).map((job, i) => (
                      <motion.tr
                        key={job.id || i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-white/2 transition-colors"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-slate-200">{job.company_name}</td>
                        <td className="px-5 py-4 text-sm text-slate-400">{job.job_title}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500 capitalize">{job.job_platform}</td>
                        <td className="px-5 py-4"><StatusBadge status={job.status} /></td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Upcoming Events + Recent Activity */}
        <Card>
          <CardHeader
            title="Upcoming Events"
            subtitle={dashData?.upcoming_events?.length ? `${dashData.upcoming_events.length} upcoming` : 'No upcoming events'}
          />
          <CardBody className="pt-2 space-y-0">
            {(dashData?.upcoming_events ?? []).length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600">No upcoming events</p>
              </div>
            ) : (
              (dashData?.upcoming_events ?? []).slice(0, 4).map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 py-3 border-b border-orbit-border last:border-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-orbit-primary/10 text-orbit-primary-light flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{ev.company_name}</p>
                    <p className="text-xs text-slate-500 truncate">{ev.job_title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {formatDate(ev.scheduled_at)} · {formatTime(ev.scheduled_at)}
                    </p>
                    {ev.location && (
                      <p className="text-[11px] text-slate-600">{ev.location}</p>
                    )}
                  </div>
                </motion.div>
              ))
            )}

            {/* Recent Activity */}
            <div className="pt-3 mt-2 border-t border-orbit-border">
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Recent Activity</p>
              {(dashData?.recent_activity ?? []).length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">No activity yet</p>
              ) : (
                (dashData?.recent_activity ?? []).slice(0, 5).map((item, i) => (
                  <motion.div
                    key={`${item.type}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 py-2.5 border-b border-orbit-border last:border-0"
                  >
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      ACTIVITY_ICONS[item.type] ?? 'bg-slate-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{timeAgo(item.created_at)}</p>
                    </div>
                    {item.status && (
                      <StatusBadge status={item.status as Job['status']} />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
