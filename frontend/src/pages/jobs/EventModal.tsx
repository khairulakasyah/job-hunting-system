import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MapPin, Link as LinkIcon } from 'lucide-react'
import { eventService, EventFormData } from '@/services/eventService'
import { jobService, Job } from '@/services/jobService'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  event?: any
  prefilledDate?: string
}

const eventTypes = [
  { value: 'interview',     label: 'Interview'       },
  { value: 'phone_screen',  label: 'Phone Screen'    },
  { value: 'technical_test', label: 'Technical Test' },
  { value: 'follow_up',     label: 'Follow-up'       },
  { value: 'offer_deadline',label: 'Offer Deadline'  },
  { value: 'assessment',    label: 'Assessment'      },
  { value: 'networking',    label: 'Networking'      },
  { value: 'other',         label: 'Other'           },
]



const inputClass = 'w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-primary transition-colors'
const labelClass = 'block text-xs font-medium text-slate-400 mb-1.5'

export function EventModal({ isOpen, onClose, onSaved, event, prefilledDate }: EventModalProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobsLoading, setJobsLoading] = useState(true)

  const [jobId, setJobId]       = useState<number>(event?.extendedProps?.job_id ?? 0)
  const [eventType, setEventType] = useState(event?.extendedProps?.event_type ?? 'interview')
  const [scheduledAt, setScheduledAt] = useState(
    event?.start ? event.start.substring(0, 16) : prefilledDate ? `${prefilledDate}T10:00` : ''
  )
  const [location, setLocation]     = useState(event?.extendedProps?.location ?? '')
  const [meetingLink, setMeetingLink] = useState(event?.extendedProps?.meeting_link ?? '')

  const isEditing = !!event

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setJobsLoading(true)
    jobService.getKanban().then(data => {
      setJobs(data)
      if (data.length > 0 && !event) {
        setJobId(data[0].id)
      }
      setJobsLoading(false)
    }).catch(() => { setJobsLoading(false) })

    if (event) {
      setJobId(event.extendedProps?.job_id ?? 0)
      setEventType(event.extendedProps?.event_type ?? 'interview')
      setScheduledAt(event.start ? event.start.substring(0, 16) : '')
      setLocation(event.extendedProps?.location ?? '')
      setMeetingLink(event.extendedProps?.meeting_link ?? '')
    }
  }, [isOpen, event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobId) { setError('Please select a job.'); return }
    setLoading(true)
    setError('')
    try {
      const data: EventFormData = {
        job_id: jobId,
        event_type: eventType,
        scheduled_at: new Date(scheduledAt).toISOString(),
        location: location || undefined,
        meeting_link: meetingLink || undefined,
      }
      if (isEditing) {
        await eventService.update(event.id, data)
      } else {
        await eventService.create(data)
      }
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
          <motion.div key="evt-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <motion.div key="evt-modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <p className="text-sm font-semibold text-slate-200">
                  {isEditing ? 'Edit Event' : 'New Event'}
                </p>
                <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                )}

                <div>
                  <label className={labelClass}>Job <span className="text-red-400">*</span></label>
                  {jobsLoading ? (
                    <div className="h-10 bg-surface2 rounded-lg animate-pulse" />
                  ) : (
                    <select value={jobId} onChange={e => setJobId(Number(e.target.value))}
                      className={inputClass + ' cursor-pointer'}>
                      <option value={0}>Select a job...</option>
                      {jobs.map(j => (
                        <option key={j.id} value={j.id}>{j.job_title} at {j.company_name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Event Type <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {eventTypes.map(et => (
                      <button key={et.value} type="button" onClick={() => setEventType(et.value)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                          eventType === et.value
                            ? 'bg-primary/20 border-primary/40 text-primary-light'
                            : 'bg-surface2 border-border text-slate-400 hover:border-border2'
                        }`}>
                        {et.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Date & Time <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input type="datetime-local" value={scheduledAt}
                      onChange={e => setScheduledAt(e.target.value)} required
                      className={inputClass + ' pl-10'} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Google Meet, Office address" className={inputClass + ' pl-10'} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Meeting Link</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..." className={inputClass + ' pl-10'} />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={loading || jobsLoading}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    {loading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
                  </button>
                  <button type="button" onClick={onClose}
                    className="px-4 py-2.5 bg-surface2 hover:bg-white/5 text-slate-400 text-sm font-medium rounded-lg border border-border transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
