import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Briefcase } from 'lucide-react'
import { jobService, Job, JobFormData } from '@/services/jobService'

interface JobModalProps {
  isOpen:  boolean
  onClose: () => void
  onSaved: () => void
  job?:    Job | null
}

const emptyForm: JobFormData = {
  company_name:    '',
  job_title:       '',
  location:        '',
  url:             '',
  job_description: '',
  salary:          '',
  job_platform:    'linkedin',
  status:          'applied',
}

const statusOptions  = [
  { value: 'applied',   label: 'Applied'   },
  { value: 'interview', label: 'Interview' },
  { value: 'offer',     label: 'Offer'     },
  { value: 'rejected',  label: 'Rejected'  },
]

const platformOptions = [
  { value: 'linkedin',  label: 'LinkedIn'  },
  { value: 'jobstreet', label: 'Jobstreet' },
  { value: 'indeed',    label: 'Indeed'    },
  { value: 'hiredly',   label: 'Hiredly'   },
]

const inputClass = 'w-full bg-orbit-surface2 border border-orbit-border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors'
const labelClass = 'block text-xs font-medium text-slate-400 mb-1.5'

export function JobModal({ isOpen, onClose, onSaved, job }: JobModalProps) {
  const [form, setForm]       = useState<JobFormData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const isEditing             = !!job

  useEffect(() => {
    setForm(job ? {
      company_name:    job.company_name,
      job_title:       job.job_title,
      location:        job.location,
      url:             job.url             ?? '',
      job_description: job.job_description ?? '',
      salary:          job.salary          ?? '',
      job_platform:    job.job_platform,
      status:          job.status,
    } : emptyForm)
    setError('')
  }, [job, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      isEditing ? await jobService.update(job.id, form) : await jobService.create(form)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

          <motion.div key="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-2xl bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orbit-primary/20 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-orbit-primary-light" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {isEditing ? 'Edit Job' : 'Add New Job'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isEditing ? 'Update your application details' : 'Track a new job application'}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto px-6 py-5 flex-1">
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Row 1 — Company + Job Title */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Company Name <span className="text-red-400">*</span></label>
                      <input name="company_name" type="text" value={form.company_name} onChange={handleChange}
                        placeholder="e.g. Google" required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Job Title <span className="text-red-400">*</span></label>
                      <input name="job_title" type="text" value={form.job_title} onChange={handleChange}
                        placeholder="e.g. Software Engineer" required className={inputClass} />
                    </div>
                  </div>

                  {/* Row 2 — Location + Salary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Location <span className="text-red-400">*</span></label>
                      <input name="location" type="text" value={form.location} onChange={handleChange}
                        placeholder="e.g. Remote, KL" required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Salary (RM)</label>
                      <input name="salary" type="number" value={form.salary} onChange={handleChange}
                        placeholder="e.g. 4500" min="0" className={inputClass} />
                    </div>
                  </div>

                  {/* Row 3 — Status + Platform */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Status</label>
                      <select name="status" value={form.status} onChange={handleChange}
                        className={inputClass + ' cursor-pointer'}>
                        {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Platform</label>
                      <select name="job_platform" value={form.job_platform} onChange={handleChange}
                        className={inputClass + ' cursor-pointer'}>
                        {platformOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Row 4 — URL full width */}
                  <div>
                    <label className={labelClass}>Job URL</label>
                    <input name="url" type="url" value={form.url} onChange={handleChange}
                      placeholder="https://example.com/job" className={inputClass} />
                  </div>

                  {/* Row 5 — Description full width */}
                  <div>
                    <label className={labelClass}>Job Description</label>
                    <textarea name="job_description" rows={5} value={form.job_description} onChange={handleChange}
                      placeholder="Paste or write job description here..."
                      className={inputClass + ' resize-y min-h-[100px]'} />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3 pt-1">
                    <button type="submit" disabled={loading}
                      className="flex-1 py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                      {loading ? 'Saving...' : isEditing ? 'Update Job' : 'Save Job'}
                    </button>
                    <button type="button" onClick={onClose}
                      className="flex-1 py-2.5 bg-orbit-surface2 hover:bg-white/5 text-slate-400 text-sm font-medium rounded-lg border border-orbit-border transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}