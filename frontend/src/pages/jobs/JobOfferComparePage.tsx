import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Building2, MapPin, Briefcase, Calendar, ArrowUpRight } from 'lucide-react'
import { jobService, Job } from '@/services/jobService'
import { JobViewModal } from './JobViewModal'

const FIELDS = [
  { id: 'company_name', label: 'Company', icon: <Building2 className="w-3.5 h-3.5" />, render: (j: Job) => j.company_name },
  { id: 'job_title', label: 'Title', icon: <Briefcase className="w-3.5 h-3.5" />, render: (j: Job) => j.job_title },
  { id: 'location', label: 'Location', icon: <MapPin className="w-3.5 h-3.5" />, render: (j: Job) => j.location },
  { id: 'salary', label: 'Salary', icon: <DollarSign className="w-3.5 h-3.5" />, render: (j: Job) => j.salary || '—' },
  { id: 'job_platform', label: 'Platform', icon: <ArrowUpRight className="w-3.5 h-3.5" />, render: (j: Job) => j.job_platform },
  { id: 'applied_date', label: 'Applied', icon: <Calendar className="w-3.5 h-3.5" />, render: (j: Job) => j.applied_date ? new Date(j.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' },
]

function parseSalary(s: string): number {
  try {
    const nums = s.replace(/[^0-9]/g, '')
    return nums ? parseInt(nums, 10) : 0
  } catch { return 0 }
}

export function JobOfferComparePage() {
  const [offers, setOffers] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewJob, setViewJob] = useState<Job | null>(null)
  const [viewOpen, setViewOpen] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await jobService.getAll(1, '', 'offer', undefined, undefined, undefined, undefined, 100)
        setOffers(data.data || [])
      } catch {
        setError(err?.response?.data?.message || err?.message || 'Failed to load offers.')
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const maxSalary = offers.length > 0
    ? Math.max(...offers.map(j => parseSalary(j.salary)), 0)
    : 0

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Offer Comparison</h1>
          <p className="text-slate-500 text-sm mt-1">{offers.length} offer{offers.length !== 1 ? 's' : ''} received</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 bg-surface rounded-xl animate-pulse" />)}
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-surface2 flex items-center justify-center mb-4">
            <DollarSign className="w-7 h-7 text-slate-500" />
          </div>
          <p className="text-slate-300 font-medium">No offers yet</p>
          <p className="text-slate-500 text-sm mt-1">Move jobs to the Offer stage to compare them here</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-4 w-48">Attribute</th>
                {offers.map(job => (
                  <th key={job.id} className="text-left px-5 py-4 min-w-[180px]">
                    <button onClick={() => { setViewJob(job); setViewOpen(true) }}
                      className="text-sm font-semibold text-primary-light hover:text-accent transition-colors text-left">
                      {job.company_name}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FIELDS.map(field => (
                <tr key={field.id}>
                  <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-2">{field.icon} {field.label}</span>
                  </td>
                  {offers.map(job => {
                    const val = field.render(job)
                    const isHighest = field.id === 'salary' && parseSalary(job.salary) >= maxSalary && maxSalary > 0
                    return (
                      <td key={job.id} className={`px-5 py-4 text-sm ${isHighest ? 'text-emerald-400 font-semibold' : 'text-slate-200'}`}>
                        {val}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <JobViewModal isOpen={viewOpen} onClose={() => setViewOpen(false)}
        onEdit={() => setViewOpen(false)} onDelete={() => setViewOpen(false)} job={viewJob} />
    </div>
  )
}
