import { motion, AnimatePresence } from 'framer-motion'
import { X, Pencil, Trash2, ExternalLink, MapPin, Building2, Briefcase, DollarSign, Layout } from 'lucide-react'
import { Job } from '@/services/jobService'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface JobViewModalProps {
  isOpen:   boolean
  onClose:  () => void
  onEdit:   () => void
  onDelete: () => void
  job:      Job | null
}

const platformLabel: Record<string, string> = {
  linkedin:  'LinkedIn',
  jobstreet: 'Jobstreet',
  indeed:    'Indeed',
  hiredly:   'Hiredly',
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-orbit-border last:border-0">
      <div className="w-7 h-7 rounded-md bg-orbit-surface2 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <div className="text-sm text-slate-200">{value}</div>
      </div>
    </div>
  )
}

export function JobViewModal({ isOpen, onClose, onEdit, onDelete, job }: JobViewModalProps) {
  if (!job) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="view-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

          <motion.div key="view-modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-lg bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-orbit-border flex-shrink-0">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-slate-100 truncate">{job.job_title}</h2>
                  </div>
                  <p className="text-sm text-slate-400">{job.company_name}</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status bar */}
              <div className="px-6 py-3 border-b border-orbit-border flex items-center justify-between flex-shrink-0">
                <StatusBadge status={job.status} />
                <span className="text-xs text-slate-600">
                  Added {new Date(job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Scrollable details */}
              <div className="overflow-y-auto flex-1 px-6">

                <DetailRow
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  label="Company"
                  value={job.company_name}
                />
                <DetailRow
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                  label="Job Title"
                  value={job.job_title}
                />
                <DetailRow
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  label="Location"
                  value={job.location}
                />
                <DetailRow
                  icon={<DollarSign className="w-3.5 h-3.5" />}
                  label="Salary"
                  value={job.salary}
                />
                <DetailRow
                  icon={<Layout className="w-3.5 h-3.5" />}
                  label="Platform"
                  value={platformLabel[job.job_platform] ?? job.job_platform}
                />
                {job.url && (
                  <DetailRow
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    label="Job URL"
                    value={
                      <a href={job.url} target="_blank" rel="noopener noreferrer"
                        className="text-orbit-primary-light hover:text-orbit-accent transition-colors truncate block">
                        {job.url}
                      </a>
                    }
                  />
                )}
                {job.job_description && (
                  <div className="py-3">
                    <p className="text-xs text-slate-500 mb-2">Job Description</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {job.job_description}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 border-t border-orbit-border flex items-center gap-3 flex-shrink-0">
                <button onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}