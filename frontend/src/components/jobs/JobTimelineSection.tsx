import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, RotateCcw, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import {
  JobTimeline,
  jobTimelineService,
  STAGES,
  STAGE_COLORS,
} from '@/services/jobTimelineService'

const MAIN_STAGES = STAGES.filter(s => s.key !== 'rejected')

interface Props {
  jobId: number
  timelines: JobTimeline[]
  loading: boolean
  modalStatus: string
  onTimelineChange: React.Dispatch<React.SetStateAction<JobTimeline[]>>
  onStatusChange: React.Dispatch<React.SetStateAction<string>>
}

export function JobTimelineSection({ jobId, timelines, loading, modalStatus, onTimelineChange, onStatusChange }: Props) {
  const [advancing, setAdvancing] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [pendingStage, setPendingStage] = useState<string | null>(null)
  const [stageDate, setStageDate] = useState(new Date().toISOString().split('T')[0])

  const STATUS_ACTIVE_STAGES: Record<string, Set<string>> = {
    saved:    new Set(['saved']),
    applied:  new Set(['saved', 'applied']),
    interview: new Set(['saved', 'applied', 'interview', 'technical_test', 'hr_interview']),
    offer:    new Set(['saved', 'applied', 'interview', 'technical_test', 'hr_interview', 'offer']),
    rejected: new Set(['saved', 'applied', 'interview', 'technical_test', 'hr_interview', 'offer', 'rejected']),
  }
  const activeStages = STATUS_ACTIVE_STAGES[modalStatus] ?? new Set()
  const isRejected = modalStatus === 'rejected'
  const currentMainIdx = MAIN_STAGES.reduce((max, s, i) => activeStages.has(s.key) ? i : max, -1)
  const getStageDate = (key: string) => timelines.find(t => t.stage === key)?.stage_date ?? null
  const nextStageKey = !isRejected && currentMainIdx < MAIN_STAGES.length - 1 ? MAIN_STAGES[currentMainIdx + 1].key : null
  const prevStageKey = currentMainIdx > 0 ? MAIN_STAGES[currentMainIdx].key : null

  const handleAdvance = async (stage: string) => {
    setAdvancing(true)
    try {
      const entry = await jobTimelineService.advance(jobId, stage, stageDate)
      onTimelineChange(prev => {
        const exists = prev.find(t => t.stage === stage)
        if (exists) return prev.map(t => t.id === exists.id ? entry : t)
        return [...prev, entry]
      })
      const statusMap: Record<string, string> = {
        saved: 'applied', applied: 'applied', interview: 'interview',
        technical_test: 'interview', hr_interview: 'interview',
        offer: 'offer', rejected: 'rejected',
      }
      onStatusChange(statusMap[stage] ?? 'applied')
      setPendingStage(null)
      const stageLabel = STAGES.find(s => s.key === stage)?.label ?? stage
      toast.success(`Advanced to ${stageLabel}`)
    } catch {
      toast.error('Failed to advance stage.')
    } finally {
      setAdvancing(false)
    }
  }

  const handleGoBack = async () => {
    if (!prevStageKey) return
    setAdvancing(true)
    try {
      await jobTimelineService.reset(jobId)
      const data = await jobTimelineService.getAll(jobId)
      onTimelineChange(data)
      const targetIdx = currentMainIdx - 1
      for (let i = 1; i <= targetIdx; i++) {
        const s = MAIN_STAGES[i]
        const date = getStageDate(s.key) ?? new Date().toISOString().split('T')[0]
        await jobTimelineService.advance(jobId, s.key, date)
      }
      const fresh = await jobTimelineService.getAll(jobId)
      onTimelineChange(fresh)
      const lastStage = MAIN_STAGES[targetIdx].key
      const statusMap: Record<string, string> = {
        saved: 'applied', applied: 'applied', interview: 'interview',
        technical_test: 'interview', hr_interview: 'interview',
        offer: 'offer', rejected: 'rejected',
      }
      onStatusChange(statusMap[lastStage] ?? 'applied')
      toast.success(`Went back to ${MAIN_STAGES[targetIdx].label}`)
    } catch {
      toast.error('Failed to go back.')
    } finally {
      setAdvancing(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      await jobTimelineService.reset(jobId)
      const data = await jobTimelineService.getAll(jobId)
      onTimelineChange(data)
      onStatusChange('applied')
      toast.success('Timeline reset')
    } catch {
      toast.error('Failed to reset timeline.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="px-6 pt-5 pb-5 border-b border-border">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Application Timeline
        </p>
        {timelines.length > 1 && (
          <button onClick={handleReset} disabled={resetting}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-border transition-colors disabled:opacity-40">
            <RotateCcw className="w-3 h-3" />
            {resetting ? 'Resetting...' : 'Reset'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-start min-w-max">
              {MAIN_STAGES.map((stage, i) => {
                const isActive = activeStages.has(stage.key)
                const colors = STAGE_COLORS[stage.key]
                const date = getStageDate(stage.key)
                const isLast = i === MAIN_STAGES.length - 1
                return (
                  <div key={stage.key} className="flex items-start">
                    <div className="flex flex-col items-center gap-1.5 w-24">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-300 ${isActive ? colors.dot : 'bg-transparent border-slate-500'}`} />
                      <span className={`text-[11px] font-semibold text-center leading-tight transition-colors duration-300 ${isActive ? colors.text : 'text-slate-600'}`}>{stage.label}</span>
                      {date ? (
                        <span className="text-[10px] text-slate-500 text-center">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      ) : (
                        <span className="text-[10px] text-slate-700 text-center">&mdash;</span>
                      )}
                    </div>
                    {!isLast && (
                      <div className={`h-[2px] w-6 mt-[7px] flex-shrink-0 transition-colors duration-300 ${isActive && activeStages.has(MAIN_STAGES[i + 1].key) ? 'bg-primary' : 'bg-slate-700'}`} />
                    )}
                  </div>
                )
              })}
              <div className="flex items-start ml-0">
                <div className="flex flex-col items-center">
                  <div className={`h-[2px] w-8 mt-[7px] flex-shrink-0 transition-colors duration-300 ${isRejected ? 'bg-red-500' : 'bg-slate-700'}`} />
                </div>
                <div className="flex flex-col items-center gap-1.5 w-24">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-300 ${isRejected ? 'bg-red-500 border-red-500' : 'bg-transparent border-slate-600'}`} />
                  <span className={`text-[11px] font-semibold text-center leading-tight transition-colors duration-300 ${isRejected ? 'text-red-400' : 'text-slate-600'}`}>Rejected</span>
                  {getStageDate('rejected') ? (
                    <span className="text-[10px] text-slate-500 text-center">{new Date(getStageDate('rejected')!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  ) : (
                    <span className="text-[10px] text-slate-700">&mdash;</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <AnimatePresence>
              {pendingStage && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-4 bg-surface2 border border-border rounded-xl space-y-3">
                    <p className="text-xs font-medium text-slate-400">
                      Set date for <span className="text-slate-200">{STAGES.find(s => s.key === pendingStage)?.label}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input type="date" value={stageDate} onChange={e => setStageDate(e.target.value)}
                          className="w-full bg-surface border border-border rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-primary transition-colors" />
                      </div>
                      <button onClick={() => handleAdvance(pendingStage)} disabled={advancing}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                        {advancing ? 'Saving...' : 'Confirm'}
                      </button>
                      <button onClick={() => setPendingStage(null)}
                        className="px-3 py-2 bg-surface hover:bg-white/5 text-slate-400 text-sm rounded-lg border border-border transition-colors">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!pendingStage && (
              <div className="flex items-center gap-2 flex-wrap">
                {prevStageKey && !isRejected && (
                  <button onClick={handleGoBack} disabled={advancing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface2 hover:bg-white/5 disabled:opacity-40 text-slate-400 text-xs font-medium rounded-lg border border-border transition-colors">
                    &larr; Previous
                  </button>
                )}
                {nextStageKey && !isRejected && (
                  <button onClick={() => { setStageDate(new Date().toISOString().split('T')[0]); setPendingStage(nextStageKey) }} disabled={advancing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors">
                    Next: {STAGES.find(s => s.key === nextStageKey)?.label} &rarr;
                  </button>
                )}
                {!isRejected && currentMainIdx >= 0 && (
                  <button onClick={() => { setStageDate(new Date().toISOString().split('T')[0]); setPendingStage('rejected') }} disabled={advancing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-colors">
                    Mark Rejected
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
