import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Briefcase, MapPin, DollarSign, Layout, Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Job } from '@/services/jobService'

const platformLabel: Record<string, string> = {
  linkedin: 'LinkedIn', jobstreet: 'Jobstreet', indeed: 'Indeed', hiredly: 'Hiredly',
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-orbit-border last:border-0">
      <div className="w-7 h-7 rounded-md bg-orbit-surface2 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <div className="text-sm text-slate-200">{value}</div>
      </div>
    </div>
  )
}

interface Props {
  job: Job
}

export function JobDetailsSection({ job }: Props) {
  const [showDesc, setShowDesc] = useState(false)

  return (
    <div className="px-6">
      <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Company" value={job.company_name} />
      <DetailRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Job Title" value={job.job_title} />
      <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={job.location} />
      <DetailRow icon={<DollarSign className="w-3.5 h-3.5" />} label="Salary" value={job.salary || '\u2014'} />
      <DetailRow icon={<Layout className="w-3.5 h-3.5" />} label="Platform" value={platformLabel[job.job_platform] ?? job.job_platform} />
      {job.applied_date && (
        <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Applied Date"
          value={new Date(job.applied_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
      )}
      {job.url && (
        <DetailRow icon={<ExternalLink className="w-3.5 h-3.5" />} label="Job URL"
          value={<a href={job.url} target="_blank" rel="noopener noreferrer" className="text-orbit-primary-light hover:text-orbit-accent transition-colors truncate block">{job.url}</a>} />
      )}

      {job.job_description && (
        <div className="py-3">
          <button onClick={() => setShowDesc(v => !v)} className="flex items-center justify-between w-full text-left">
            <p className="text-xs text-slate-500">Job Description</p>
            {showDesc ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
          </button>
          <AnimatePresence>
            {showDesc && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed mt-3">{job.job_description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
