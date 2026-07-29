import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Pencil, Trash2, ExternalLink, MapPin,
  Building2, Briefcase, DollarSign, Layout,
  Clock, RotateCcw, ChevronDown, ChevronUp,
  Calendar
} from 'lucide-react'
import { Job } from '@/services/jobService'
import {
  JobTimeline,
  jobTimelineService,
  STAGES,
  STAGE_COLORS,
} from '@/services/jobTimelineService'
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

// Main stages (linear) vs rejected (branch)
const MAIN_STAGES  = STAGES.filter(s => s.key !== 'rejected')
const REJECT_STAGE = STAGES.find(s => s.key === 'rejected')!

function DetailRow({ icon, label, value }: {
  icon:  React.ReactNode
  label: string
  value: React.ReactNode
}) {
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
  const [timelines, setTimelines]   = useState<JobTimeline[]>([])
  const [tlLoading, setTlLoading]   = useState(false)
  const [advancing, setAdvancing]   = useState(false)
  const [resetting, setResetting]   = useState(false)
  const [showDesc, setShowDesc]     = useState(false)

  // Stage date picker state
  const [pendingStage, setPendingStage] = useState<string | null>(null)
  const [stageDate, setStageDate]       = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!isOpen || !job) return
    setPendingStage(null)
    setShowDesc(false)
    fetchTimelines()
  }, [isOpen, job])

  const fetchTimelines = async () => {
    if (!job) return
    setTlLoading(true)
    try {
      const data = await jobTimelineService.getAll(job.id)
      setTimelines(data)
    } catch {
      //
    } finally {
      setTlLoading(false)
    }
  }

  // Which stages are active
  const activeStages = new Set(timelines.map(t => t.stage))

  // Current furthest stage index (excluding rejected)
  const currentMainIdx = MAIN_STAGES.reduce((max, s, i) =>
    activeStages.has(s.key) ? i : max, -1)

  const isRejected = activeStages.has('rejected')

  // Get date for a stage
  const getStageDate = (key: string) =>
    timelines.find(t => t.stage === key)?.stage_date ?? null

  // Next stage to activate
  const nextStageKey = !isRejected && currentMainIdx < MAIN_STAGES.length - 1
    ? MAIN_STAGES[currentMainIdx + 1].key
    : null

  // Previous stage (for going back)
  const prevStageKey = currentMainIdx > 0
    ? MAIN_STAGES[currentMainIdx].key
    : null

  const handleAdvance = async (stage: string) => {
    if (!job) return
    setAdvancing(true)
    try {
      const entry = await jobTimelineService.advance(job.id, stage, stageDate)
      setTimelines(prev => {
        const exists = prev.find(t => t.stage === stage)
        if (exists) return prev.map(t => t.id === exists.id ? entry : t)
        return [...prev, entry]
      })
      setPendingStage(null)
    } catch {
      //
    } finally {
      setAdvancing(false)
    }
  }

  const handleGoBack = async () => {
    if (!job || !prevStageKey) return
    setAdvancing(true)
    try {
      // Remove current stage from DB by resetting then re-advancing to prev-1
      await jobTimelineService.reset(job.id)
      const data = await jobTimelineService.getAll(job.id)
      setTimelines(data)

      // Re-advance all stages up to but not including current
      const targetIdx = currentMainIdx - 1
      for (let i = 1; i <= targetIdx; i++) {
        const s     = MAIN_STAGES[i]
        const date  = getStageDate(s.key) ?? new Date().toISOString().split('T')[0]
        await jobTimelineService.advance(job.id, s.key, date)
      }

      const fresh = await jobTimelineService.getAll(job.id)
      setTimelines(fresh)
    } catch {
      //
    } finally {
      setAdvancing(false)
    }
  }

  const handleReset = async () => {
    if (!job) return
    setResetting(true)
    try {
      await jobTimelineService.reset(job.id)
      const data = await jobTimelineService.getAll(job.id)
      setTimelines(data)
    } catch {
      //
    } finally {
      setResetting(false)
    }
  }

  // Current status label for badge
  const currentStageLabel = isRejected
    ? 'rejected'
    : currentMainIdx >= 0
      ? MAIN_STAGES[currentMainIdx].key
      : 'applied'

  const statusForBadge = (
    currentStageLabel === 'offer'          ? 'offer'     :
    currentStageLabel === 'rejected'       ? 'rejected'  :
    currentStageLabel === 'interview'      ||
    currentStageLabel === 'technical_test' ||
    currentStageLabel === 'hr_interview'   ? 'interview' :
    currentStageLabel === 'saved'          ? 'saved'     : 'applied'
  ) as 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

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
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-4xl bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-orbit-border flex-shrink-0">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-base font-semibold text-slate-100 truncate">{job.job_title}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{job.company_name}</p>
                </div>
                <button onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status bar */}
              <div className="px-6 py-3 border-b border-orbit-border flex items-center justify-between flex-shrink-0">
                <StatusBadge status={statusForBadge} />
                <span className="text-xs text-slate-600">
                  Added {new Date(job.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </span>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1">

                {/* ── Timeline ── */}
                <div className="px-6 pt-5 pb-5 border-b border-orbit-border">
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Application Timeline
                    </p>
                    {timelines.length > 1 && (
                      <button
                        onClick={handleReset}
                        disabled={resetting}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-orbit-border transition-colors disabled:opacity-40"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {resetting ? 'Resetting...' : 'Reset'}
                      </button>
                    )}
                  </div>

                  {tlLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-5 h-5 border-2 border-orbit-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* ── Main linear timeline ── */}
                      <div className="overflow-x-auto pb-2">
                        <div className="flex items-start min-w-max">
                          {MAIN_STAGES.map((stage, i) => {
                            const isActive  = activeStages.has(stage.key)
                            const colors    = STAGE_COLORS[stage.key]
                            const date      = getStageDate(stage.key)
                            const isLast    = i === MAIN_STAGES.length - 1

                            return (
                              <div key={stage.key} className="flex items-start">
                                {/* Node */}
                                <div className="flex flex-col items-center gap-1.5 w-24">
                                  {/* Dot */}
                                  <div className={`
                                    w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-300
                                    ${isActive
                                      ? colors.dot
                                      : 'bg-transparent border-slate-500'}
                                  `} />

                                  {/* Label */}
                                  <span className={`
                                    text-[11px] font-semibold text-center leading-tight transition-colors duration-300
                                    ${isActive ? colors.text : 'text-slate-600'}
                                  `}>
                                    {stage.label}
                                  </span>

                                  {/* Date */}
                                  {date ? (
                                    <span className="text-[10px] text-slate-500 text-center">
                                      {new Date(date).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric',
                                      })}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-700 text-center">—</span>
                                  )}
                                </div>

                                {/* Connector */}
                                {!isLast && (
                                  <div className={`
                                    h-[2px] w-6 mt-[7px] flex-shrink-0 transition-colors duration-300
                                    ${isActive && activeStages.has(MAIN_STAGES[i + 1].key)
                                      ? 'bg-orbit-primary'
                                      : 'bg-slate-700'}
                                  `} />
                                )}
                              </div>
                            )
                          })}

                          {/* ── Rejected branch ── */}
                          <div className="flex items-start ml-0">
                            {/* Branch line down from Offer */}
                            <div className="flex flex-col items-center">
                              <div className={`
                                h-[2px] w-8 mt-[7px] flex-shrink-0 transition-colors duration-300
                                ${isRejected ? 'bg-red-500' : 'bg-slate-700'}
                              `} />
                            </div>

                            {/* Rejected node */}
                            <div className="flex flex-col items-center gap-1.5 w-24">
                              <div className={`
                                w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-300
                                ${isRejected
                                  ? 'bg-red-500 border-red-500'
                                  : 'bg-transparent border-slate-600'}
                              `} />
                              <span className={`
                                text-[11px] font-semibold text-center leading-tight transition-colors duration-300
                                ${isRejected ? 'text-red-400' : 'text-slate-600'}
                              `}>
                                Rejected
                              </span>
                              {getStageDate('rejected') ? (
                                <span className="text-[10px] text-slate-500 text-center">
                                  {new Date(getStageDate('rejected')!).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                  })}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-700">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Stage controls ── */}
                      <div className="mt-5 space-y-3">

                        {/* Date picker — shown when pending */}
                        <AnimatePresence>
                          {pendingStage && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{   opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-orbit-surface2 border border-orbit-border rounded-xl space-y-3">
                                <p className="text-xs font-medium text-slate-400">
                                  Set date for <span className="text-slate-200">
                                    {STAGES.find(s => s.key === pendingStage)?.label}
                                  </span>
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    <input
                                      type="date"
                                      value={stageDate}
                                      onChange={e => setStageDate(e.target.value)}
                                      className="w-full bg-orbit-surface border border-orbit-border rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-orbit-primary transition-colors"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleAdvance(pendingStage)}
                                    disabled={advancing}
                                    className="px-4 py-2 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                                  >
                                    {advancing ? 'Saving...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => setPendingStage(null)}
                                    className="px-3 py-2 bg-orbit-surface hover:bg-white/5 text-slate-400 text-sm rounded-lg border border-orbit-border transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Action buttons */}
                        {!pendingStage && (
                          <div className="flex items-center gap-2 flex-wrap">

                            {/* Previous */}
                            {prevStageKey && !isRejected && (
                              <button
                                onClick={handleGoBack}
                                disabled={advancing}
                                className="flex items-center gap-1.5 px-3 py-2 bg-orbit-surface2 hover:bg-white/5 disabled:opacity-40 text-slate-400 text-xs font-medium rounded-lg border border-orbit-border transition-colors"
                              >
                                ← Previous
                              </button>
                            )}

                            {/* Next */}
                            {nextStageKey && !isRejected && (
                              <button
                                onClick={() => {
                                  setStageDate(new Date().toISOString().split('T')[0])
                                  setPendingStage(nextStageKey)
                                }}
                                disabled={advancing}
                                className="flex items-center gap-1.5 px-3 py-2 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                Next: {STAGES.find(s => s.key === nextStageKey)?.label} →
                              </button>
                            )}

                            {/* Rejected button — only show if not already rejected and not at saved */}
                            {!isRejected && currentMainIdx >= 0 && (
                              <button
                                onClick={() => {
                                  setStageDate(new Date().toISOString().split('T')[0])
                                  setPendingStage('rejected')
                                }}
                                disabled={advancing}
                                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-colors"
                              >
                                Mark Rejected
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* ── Job Details ── */}
                <div className="px-6">
                  <DetailRow icon={<Building2 className="w-3.5 h-3.5" />}  label="Company"  value={job.company_name} />
                  <DetailRow icon={<Briefcase className="w-3.5 h-3.5" />}  label="Job Title" value={job.job_title}    />
                  <DetailRow icon={<MapPin className="w-3.5 h-3.5" />}     label="Location"  value={job.location}     />
                  <DetailRow icon={<DollarSign className="w-3.5 h-3.5" />} label="Salary"    value={job.salary || '—'} />
                  <DetailRow icon={<Layout className="w-3.5 h-3.5" />}     label="Platform"
                    value={platformLabel[job.job_platform] ?? job.job_platform} />
                  {job.applied_date && (
                    <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Applied Date"
                      value={new Date(job.applied_date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    />
                  )}
                  {job.url && (
                    <DetailRow icon={<ExternalLink className="w-3.5 h-3.5" />} label="Job URL"
                      value={
                        <a href={job.url} target="_blank" rel="noopener noreferrer"
                          className="text-orbit-primary-light hover:text-orbit-accent transition-colors truncate block">
                          {job.url}
                        </a>
                      }
                    />
                  )}

                  {/* Collapsible description */}
                  {job.job_description && (
                    <div className="py-3">
                      <button onClick={() => setShowDesc(v => !v)}
                        className="flex items-center justify-between w-full text-left">
                        <p className="text-xs text-slate-500">Job Description</p>
                        {showDesc
                          ? <ChevronUp   className="w-3.5 h-3.5 text-slate-600" />
                          : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                        }
                      </button>
                      <AnimatePresence>
                        {showDesc && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{   opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed mt-3">
                              {job.job_description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-orbit-border flex items-center gap-3 flex-shrink-0">
                <button onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
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