import { useEffect, useState, useMemo } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { Briefcase, Clock, Trophy, XCircle, LayoutDashboard, Calendar, TrendingUp, Shield } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui'
import { cn } from '@/utils/cn'
import { dashboardService, DashboardData } from '@/services/dashboardService'
import { StatusBadge } from '@/components/ui/StatusBadge'

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0A66C2', indeed: '#003A9B', jobstreet: '#FF6B00', hiredly: '#00BFA5',
}

function formatMonth(ym: string): string {
  const d = new Date(ym + '-01')
  return d.toLocaleDateString('en-US', { month: 'short' })
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface2 border border-border rounded-xl p-3 shadow-2xl">
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
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function AdminDashboardPage() {
  const [error, setError] = useState('')
  const [, setLoading] = useState(true)
  const [dashData, setDashData] = useState<DashboardData | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const data = await dashboardService.getAdminDashboard()
        setDashData(data)
      } catch {
        setError('Failed to load admin dashboard.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

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

  const stageLabels: Record<string, string> = {
    saved_to_applied: 'Saved \u2192 Applied',
    applied_to_interview: 'Applied \u2192 Interview',
    interview_to_offer: 'Interview \u2192 Offer',
    applied_to_rejected: 'Applied \u2192 Rejected',
  }

  const stageData = useMemo(() =>
    Object.entries(dashData?.avg_days_per_stage ?? {}).map(([key, val]) => ({
      stage: stageLabels[key] ?? key,
      days: val ?? 0,
      color: key === 'applied_to_rejected' ? '#EF4444' : '#4F46E5',
    })).filter(d => d.days > 0), [dashData?.avg_days_per_stage])

  const weeklyData = useMemo(() =>
    (dashData?.weekly_activity ?? []).map(w => ({ day: w.day_name, actions: w.count })),
    [dashData?.weekly_activity])

  const platformSuccessData = useMemo(() =>
    (dashData?.platform_success ?? []).map(p => ({
      platform: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
      total: p.total, offers: p.offers, rate: p.rate,
      color: PLATFORM_COLORS[p.platform] ?? '#64748B',
    })), [dashData?.platform_success])

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1600px]">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">All Users Dashboard</h1>
            <span className="text-[10px] font-semibold bg-primary/20 text-primary-light px-2 py-0.5 rounded-full uppercase">Admin</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Aggregated analytics across all users</p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Jobs', value: dashData?.status_distribution.reduce((s, i) => s + i.count, 0) ?? 0, icon: <Briefcase className="w-5 h-5" />, color: 'text-primary-light', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'Applied', value: dashData?.status_distribution.find(s => s.status === 'applied')?.count ?? 0, icon: <LayoutDashboard className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Interview', value: dashData?.status_distribution.find(s => s.status === 'interview')?.count ?? 0, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Offer', value: dashData?.status_distribution.find(s => s.status === 'offer')?.count ?? 0, icon: <Trophy className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Rejected', value: dashData?.status_distribution.find(s => s.status === 'rejected')?.count ?? 0, icon: <XCircle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          { label: 'Success Rate', value: dashData ? `${dashData.success_rate}%` : 0, icon: <TrendingUp className="w-5 h-5" />, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-surface border ${card.border} rounded-xl p-5 flex items-center gap-4`}>
            <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.color} flex items-center justify-center flex-shrink-0`}>{card.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Avg Time per Stage + Weekly Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Average Time per Stage" subtitle="Days between status transitions" />
          <CardBody className="pt-2">
            {stageData.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-xs text-slate-600">Not enough data yet</div>
            ) : (
              <div className="space-y-4">
                {stageData.map(item => {
                  const maxDays = Math.max(...stageData.map(d => d.days), 1)
                  return (
                    <div key={item.stage} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-36 flex-shrink-0">{item.stage}</span>
                      <div className="flex-1 h-5 bg-surface3 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(item.days / maxDays) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full flex items-center justify-end pr-2"
                          style={{ background: item.color, minWidth: item.days > 0 ? '40px' : '0' }}>
                          {item.days > 0 && <span className="text-[10px] text-white font-semibold">{item.days}d</span>}
                        </motion.div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Weekly Activity" subtitle="Status changes per day of week" />
          <CardBody className="pt-2">
            {weeklyData.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-xs text-slate-600">No activity data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="actions" name="Actions" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((_, i) => <Cell key={i} fill="#4F46E5" fillOpacity={0.7 + (i / weeklyData.length) * 0.3} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader title="Application Trends" subtitle="Applications per month" />
          <CardBody className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="admin-grad-apps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="applications" name="Applications" stroke="#4F46E5" strokeWidth={2} fill="url(#admin-grad-apps)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            {trendData.length > 0 && (
              <div className="flex items-center gap-4 mt-2 pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-3 h-0.5 bg-primary rounded" /> Applications
                </div>
                <div className="ml-auto text-xs text-slate-600">
                  Last month: <span className="text-slate-200 font-semibold">{trendData[trendData.length - 1]?.applications ?? 0}</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Jobs by Platform" subtitle="Where users are applying" />
          <CardBody className="pt-2">
            {platformData.length === 0 ? (
              <div className="flex items-center justify-center h-[160px] text-xs text-slate-600">No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={platformData} cx="50%" cy="50%" innerRadius={44} outerRadius={62} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {platformData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 mt-2">
                  {platformData.map(item => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-xs text-slate-400 flex-1">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface3 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(item.value / Math.max(...platformData.map(d => d.value))) * 100}%`, background: item.color }} />
                        </div>
                        <span className="text-xs text-slate-300 w-8 text-right">{item.value}</span>
                      </div>
                    </div>
                  ))}
                  {platformSuccessData.some(p => p.offers > 0) && (
                    <div className="pt-2 mt-2 border-t border-border">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Success Rate</p>
                      {platformSuccessData.filter(p => p.total > 0).map(p => (
                        <div key={p.platform} className="flex items-center gap-2 text-xs mb-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                          <span className="text-slate-400 w-20 truncate">{p.platform}</span>
                          <div className="flex-1 h-1.5 bg-surface3 rounded-full overflow-hidden">
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

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader title="Recent Activity Across All Users" subtitle={`${dashData?.recent_activity.length ?? 0} recent actions`} />
          <CardBody className="pt-2 space-y-0">
            {(dashData?.recent_activity ?? []).length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">No activity yet</p>
            ) : (
              (dashData?.recent_activity ?? []).slice(0, 8).map((item, i) => (
                <motion.div key={`${item.type}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                    item.type === 'job_created' ? 'bg-emerald-500' : item.type === 'stage_advanced' ? 'bg-amber-500' : 'bg-primary')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{timeAgo(item.created_at)}</p>
                  </div>
                  {item.status && <StatusBadge status={item.status as 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'} />}
                </motion.div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Upcoming Events"
            subtitle={dashData?.upcoming_events?.length ? `${dashData.upcoming_events.length} upcoming` : 'No upcoming events'} />
          <CardBody className="pt-2 space-y-0">
            {(dashData?.upcoming_events ?? []).length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600">No upcoming events</p>
              </div>
            ) : (
              (dashData?.upcoming_events ?? []).slice(0, 5).map((ev, i) => (
                <motion.div key={ev.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary-light flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{ev.company_name}</p>
                    <p className="text-xs text-slate-500 truncate">{ev.job_title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {new Date(ev.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' \u00b7 '}
                      {new Date(ev.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
