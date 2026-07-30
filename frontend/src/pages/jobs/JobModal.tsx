import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Briefcase, Link, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { jobService, Job, JobFormData } from '@/services/jobService'
import { useAuth } from '@/contexts/AuthContext'

interface JobModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  job?: Job | null
}

type Step = 'url' | 'scraping' | 'form'

const emptyForm: JobFormData = {
  company_name: '',
  job_title: '',
  location: '',
  url: '',
  job_description: '',
  salary: '',
  job_platform: '',
  status: 'applied',
  applied_date: new Date().toISOString().split('T')[0], // today
}

const statusOptions = [
  { value: 'saved',     label: 'Saved'     },
  { value: 'applied',   label: 'Applied'   },
  { value: 'interview', label: 'Interview' },
  { value: 'offer',     label: 'Offer'     },
  { value: 'rejected',  label: 'Rejected'  },
]

const inputClass = 'w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-primary transition-colors'
const labelClass = 'block text-xs font-medium text-slate-400 mb-1.5'

function detectPlatform(url: string): string {
  if (url.includes('linkedin')) return 'linkedin'
  if (url.includes('jobstreet')) return 'jobstreet'
  if (url.includes('indeed')) return 'indeed'
  if (url.includes('hiredly')) return 'hiredly'
  return 'linkedin'
}

export function JobModal({ isOpen, onClose, onSaved, job }: JobModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('url')
  const [urlInput, setUrlInput] = useState('')
  const [scrapeError, setScrapeError] = useState('')
  const [form, setForm] = useState<JobFormData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!job
  const [rescraping, setRescraping] = useState(false)
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([])

  useEffect(() => {
    jobService.getPlatforms().then(setAvailablePlatforms).catch(() => {})
  }, [])

  // Reset on open
  useEffect(() => {
    if (!isOpen) return
    if (job) {
      // Editing — skip URL step, go straight to form
      setStep('form')
      setForm({
        company_name: job.company_name,
        job_title: job.job_title,
        location: job.location,
        url: job.url ?? '',
        job_description: job.job_description ?? '',
        salary: job.salary ?? '',
        job_platform: job.job_platform,
        status: job.status,
        applied_date: new Date().toISOString().split('T')[0],
      })
    } else {
      // Creating — pre-fill from profile preferences
      setStep('url')
      setUrlInput('')
      setForm({
        ...emptyForm,
        job_title: user?.target_role ?? '',
        location: user?.preferred_location ?? '',
        salary: user?.salary_expectation ?? '',
        job_platform: user?.preferred_platform ?? '',
      })
      setScrapeError('')
    }
    setError('')
  }, [job, isOpen])

  const handleScrape = async () => {
    if (!urlInput.trim()) return
    setScrapeError('')
    setStep('scraping')

    try {
      const data = await jobService.scrape(urlInput)

      // Map scraped data → form fields
      setForm({
        company_name: data.company_name !== 'N/A' ? data.company_name : '',
        job_title: data.job_title !== 'N/A' ? data.job_title : '',
        location: data.location !== 'N/A' ? data.location : '',
        url: urlInput,
        job_description: [
          data.job_scope !== 'Not found' ? `RESPONSIBILITIES\n${data.job_scope}` : '',
          data.skill_requirements !== 'Not specified' ? `\nREQUIREMENTS\n${data.skill_requirements}` : '',
          data.benefits !== 'Not specified' ? `\nBENEFITS\n${data.benefits}` : '',
        ].filter(Boolean).join('\n').trim(),
        salary: data.salary_range !== 'Not specified' ? data.salary_range : '',
        job_platform: detectPlatform(urlInput),
        status: 'applied',
        applied_date: new Date().toISOString().split('T')[0],
      })
      setStep('form')
    } catch {
      setScrapeError(err.response?.data?.message || 'Failed to scrape. You can fill the form manually.')
      setStep('url')
    }
  }

  const handleSkip = () => {
    setForm({ ...emptyForm, url: urlInput })
    setStep('form')
  }

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
    } catch {
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
            <div role="dialog" aria-modal="true" className="w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[95vh]"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-primary-light" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {isEditing ? 'Edit Job' : step === 'form' ? 'Review & Save Job' : 'Add New Job'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isEditing
                        ? 'Update your application details'
                        : step === 'url' || step === 'scraping'
                          ? 'Paste a job URL to auto-fill the form'
                          : 'Review the details before saving'}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Step 1: URL input ── */}
              {(step === 'url' || step === 'scraping') && !isEditing && (
                <div className="px-6 py-8 flex flex-col items-center text-center gap-6">

                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    {step === 'scraping'
                      ? <Loader2 className="w-7 h-7 text-primary-light animate-spin" />
                      : <Link className="w-7 h-7 text-primary-light" />
                    }
                  </div>

                  <div>
                    <p className="text-slate-200 font-medium mb-1">
                      {step === 'scraping' ? 'Scraping job data...' : 'Paste the job posting URL'}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {step === 'scraping'
                        ? 'This may take a few seconds'
                        : 'We\'ll auto-fill the form from Jobstreet, LinkedIn, Indeed or Hiredly'}
                    </p>
                  </div>

                  {scrapeError && (
                    <div className="w-full flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-left">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {scrapeError}
                    </div>
                  )}

                  <div className="w-full space-y-3">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleScrape()}
                      placeholder="https://www.jobstreet.com.my/job/..."
                      disabled={step === 'scraping'}
                      className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-primary transition-colors disabled:opacity-50"
                    />

                    <button
                      onClick={handleScrape}
                      disabled={!urlInput.trim() || step === 'scraping'}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {step === 'scraping'
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                        : <><ArrowRight className="w-4 h-4" /> Auto-fill</>
                      }
                    </button>

                    <button
                      onClick={handleSkip}
                      disabled={step === 'scraping'}
                      className="w-full py-2.5 bg-surface2 hover:bg-white/5 disabled:opacity-50 text-slate-400 text-sm font-medium rounded-lg border border-border transition-colors"
                    >
                      Skip — fill manually
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Form ── */}
              {step === 'form' && (
                <>
                  <div className="px-6 py-5 flex-1 overflow-y-auto">
                    {error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <form id="job-form" onSubmit={handleSubmit} className={`transition-opacity duration-200 ${rescraping ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">

                        {/* Col 1 */}
                        <div className="space-y-4">
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
                          <div>
                            <label className={labelClass}>Location <span className="text-red-400">*</span></label>
                            <input name="location" type="text" value={form.location} onChange={handleChange}
                              placeholder="e.g. Remote, KL" required className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Salary</label>
                            <input name="salary" type="text" value={form.salary} onChange={handleChange}
                              placeholder="e.g. RM 4500 - RM 6000" className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Status</label>
                            <select name="status" value={form.status} onChange={handleChange}
                              className={inputClass + ' cursor-pointer'}>
                              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Platform</label>
                            <input name="job_platform" type="text" value={form.job_platform} onChange={handleChange}
                              placeholder="e.g. LinkedIn, Indeed, JobStreet"
                              list="platform-list" className={inputClass} />
                            <datalist id="platform-list">
                              {availablePlatforms.map(p => (
                                <option key={p} value={p} />
                              ))}
                            </datalist>
                          </div>
                          <div>
                            <label className={labelClass}>Applied Date</label>
                            <input name="applied_date" type="date" value={form.applied_date} onChange={handleChange}
                              className={inputClass} />
                          </div>
                        </div>

                        {/* Col 2 */}
                        <div className="flex flex-col gap-4">
                          {/* URL + Rescrape */}
                          <div>
                            <label className={labelClass}>Job URL</label>
                            <div className="flex gap-2">
                              <input name="url" type="url" value={form.url} onChange={handleChange}
                                placeholder="https://example.com/job" className={inputClass} />
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!form.url.trim()) return
                                  setScrapeError('')
                                  setRescraping(true)
                                  try {
                                    const data = await jobService.scrape(form.url)
                                    setForm(prev => ({
                                      ...prev,
                                      company_name: data.company_name !== 'N/A' ? data.company_name : prev.company_name,
                                      job_title: data.job_title !== 'N/A' ? data.job_title : prev.job_title,
                                      location: data.location !== 'N/A' ? data.location : prev.location,
                                      salary: data.salary_range !== 'Not specified' ? data.salary_range : prev.salary,
                                      job_platform: detectPlatform(form.url),
                                      job_description: [
                                        data.job_scope !== 'Not found' ? `RESPONSIBILITIES\n${data.job_scope}` : '',
                                        data.skill_requirements !== 'Not specified' ? `\nREQUIREMENTS\n${data.skill_requirements}` : '',
                                        data.benefits !== 'Not specified' ? `\nBENEFITS\n${data.benefits}` : '',
                                      ].filter(Boolean).join('\n').trim() || prev.job_description,
                                    }))
                                  } catch {
                                    setScrapeError(err.response?.data?.message || 'Rescrape failed.')
                                  } finally {
                                    setRescraping(false)
                                  }
                                }}
                                disabled={!form.url.trim() || rescraping}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-surface2 hover:bg-white/5 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-lg border border-border transition-colors whitespace-nowrap"
                              >
                                {rescraping
                                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scraping...</>
                                  : <>↻ Rescrape</>
                                }
                              </button>
                            </div>
                            {scrapeError && <p className="text-xs text-red-400 mt-1">{scrapeError}</p>}
                          </div>

                          <div className="flex flex-col flex-1">
                            <label className={labelClass}>Job Description</label>
                            <textarea name="job_description" value={form.job_description} onChange={handleChange}
                              placeholder="Paste or write job description here..."
                              className={inputClass + ' resize-none flex-1'} />
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
                    {!isEditing && (
                      <button type="button" onClick={() => setStep('url')}
                        className="px-4 py-2.5 bg-surface2 hover:bg-white/5 text-slate-400 text-sm font-medium rounded-lg border border-border transition-colors">
                        ← Back
                      </button>
                    )}
                    <button type="submit" form="job-form" disabled={loading}
                      className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                      {loading ? 'Saving...' : isEditing ? 'Update Job' : 'Save Job'}
                    </button>
                    <button type="button" onClick={onClose}
                      className="px-4 py-2.5 bg-surface2 hover:bg-white/5 text-slate-400 text-sm font-medium rounded-lg border border-border transition-colors">
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}