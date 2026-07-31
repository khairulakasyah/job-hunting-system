import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Server, Database, Globe, Cpu, Mail, MonitorSmartphone, HardDrive, RefreshCw,
  Activity, CheckCircle2, XCircle, AlertTriangle, HelpCircle, Shield,
} from 'lucide-react'
import { adminService, ServiceHealth, ServicesHealth } from '@/services/adminService'
import { Card, CardBody } from '@/components/ui'
import { cn } from '@/utils/cn'

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  app: <Server className="w-5 h-5" />,
  database: <Database className="w-5 h-5" />,
  scraper: <Globe className="w-5 h-5" />,
  ai: <Cpu className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />,
  frontend: <MonitorSmartphone className="w-5 h-5" />,
  storage: <HardDrive className="w-5 h-5" />,
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  ok: { label: 'Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  warning: { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  unconfigured: { label: 'Not Configured', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  error: { label: 'Down', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <XCircle className="w-3.5 h-3.5" /> },
}

const OVERALL_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  ok: { label: 'All Systems Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  degraded: { label: 'Degraded', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  error: { label: 'Service Down', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' },
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function ServiceCard({ service, index }: { service: ServiceHealth; index: number }) {
  const meta = STATUS_META[service.status] ?? STATUS_META.error
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className={cn('h-full border', meta.border)}>
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', meta.bg, meta.color)}>
                {SERVICE_ICONS[service.key] ?? <Activity className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{service.label}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {service.status === 'ok' ? `${service.latency_ms}ms` : '\u2014'}
                </p>
              </div>
            </div>
            <span className={cn('flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border flex-shrink-0', meta.color, meta.bg, meta.border)}>
              {meta.icon}
              {meta.label}
            </span>
          </div>
          {service.detail && (
            <p className="text-xs text-slate-500 leading-relaxed break-words">{service.detail}</p>
          )}
        </CardBody>
      </Card>
    </motion.div>
  )
}

export function AdminServicesPage() {
  const [health, setHealth] = useState<ServicesHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHealth = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminService.getServicesHealth()
      setHealth(data)
    } catch {
      setError('Failed to check service status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHealth() }, [])

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">{error}</p>
          <button onClick={fetchHealth}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    )
  }

  const overall = health ? OVERALL_META[health.overall] ?? OVERALL_META.error : null

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1600px]">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">Service Status</h1>
            <span className="text-[10px] font-semibold bg-primary/20 text-primary-light px-2 py-0.5 rounded-full uppercase">Admin</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Health checks for all system components</p>
        </div>
        <div className="flex items-center gap-3">
          {overall && health && (
            <span className={cn('flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border', overall.color, overall.bg, overall.border)}>
              <span className={cn('w-2 h-2 rounded-full', overall.dot)} />
              {overall.label}
            </span>
          )}
          <button onClick={fetchHealth} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
          </button>
        </div>
      </motion.div>

      {health && (
        <p className="text-xs text-slate-600">
          Last checked: {formatTime(health.checked_at)}
        </p>
      )}

      {loading && !health ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-32 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(health?.services ?? []).map((s, i) => (
            <ServiceCard key={s.key} service={s} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
