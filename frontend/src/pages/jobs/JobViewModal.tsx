import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pencil, Trash2 } from 'lucide-react'
import { Job } from '@/services/jobService'
import { JobTimeline, jobTimelineService } from '@/services/jobTimelineService'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AttachmentList } from '@/components/jobs/AttachmentList'
import { NotesPanel } from '@/components/jobs/NotesPanel'
import { JobTimelineSection } from '@/components/jobs/JobTimelineSection'
import { JobDetailsSection } from '@/components/jobs/JobDetailsSection'
import { CoverLetterTab } from '@/components/jobs/CoverLetterTab'
import { InterviewPrepTab } from '@/components/jobs/InterviewPrepTab'

interface JobViewModalProps {
  isOpen:   boolean
  onClose:  () => void
  onEdit:   () => void
  onDelete: () => void
  job:      Job | null
}

type Tab = 'details' | 'attachments' | 'notes' | 'prep' | 'cover-letter'

const TABS: { key: Tab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'notes', label: 'Notes' },
  { key: 'prep', label: 'Interview Prep' },
  { key: 'cover-letter', label: 'Cover Letter' },
]

export function JobViewModal({ isOpen, onClose, onEdit, onDelete, job }: JobViewModalProps) {
  const [timelines, setTimelines] = useState<JobTimeline[]>([])
  const [tlLoading, setTlLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [modalStatus, setModalStatus] = useState<string>(job?.status ?? 'applied')

  const fetchTimelines = async () => {
    if (!job) return
    setTlLoading(true)
    try {
      const data = await jobTimelineService.getAll(job.id)
      setTimelines(data)
    } catch {} finally {
      setTlLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !job) return
    setModalStatus(job.status)
    setActiveTab('details')
    fetchTimelines()
  }, [isOpen, job])

  if (!job) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="view-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div key="view-modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div role="dialog" aria-modal="true" className="w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-base font-semibold text-slate-100 truncate">{job.job_title}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{job.company_name}</p>
                </div>
                <button onClick={onClose} aria-label="Close"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
                <StatusBadge status={modalStatus as 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'} />
                <span className="text-xs text-slate-600">
                  Added {new Date(job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="px-4 sm:px-6 border-b border-border flex-shrink-0">
                <div className="flex gap-4 sm:gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} role="tab" aria-selected={activeTab === tab.key}
                      className={`pb-3 pt-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                        activeTab === tab.key
                          ? 'text-primary-light border-primary-light'
                          : 'text-slate-500 border-transparent hover:text-slate-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {activeTab === 'details' && (
                  <>
                    <JobTimelineSection
                      jobId={job.id}
                      timelines={timelines}
                      loading={tlLoading}
                      modalStatus={modalStatus}
                      onTimelineChange={setTimelines}
                      onStatusChange={setModalStatus} />
                    <JobDetailsSection job={job} />
                  </>
                )}
                {activeTab === 'attachments' && (
                  <div className="p-6"><AttachmentList jobId={job.id} /></div>
                )}
                {activeTab === 'notes' && (
                  <div className="p-6"><NotesPanel jobId={job.id} /></div>
                )}
                {activeTab === 'cover-letter' && (
                  <CoverLetterTab jobId={job.id} />
                )}
                {activeTab === 'prep' && (
                  <InterviewPrepTab jobId={job.id} timelines={timelines} onTimelineReload={fetchTimelines} />
                )}
              </div>

              <div className="px-4 sm:px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
                <button onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
