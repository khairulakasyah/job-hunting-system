import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { Plus, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { jobService, Job } from '@/services/jobService'
import { KanbanCard } from './KanbanCard'
import { JobViewModal } from './JobViewModal'
import { JobModal } from './JobModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

const COLUMNS: { id: string; label: string }[] = [
  { id: 'saved',     label: 'Saved'     },
  { id: 'applied',   label: 'Applied'   },
  { id: 'interview', label: 'Interview' },
  { id: 'offer',     label: 'Offer'     },
  { id: 'rejected',  label: 'Rejected'  },
]

const columnColors: Record<string, string> = {
  saved:     'border-t-slate-500',
  applied:   'border-t-blue-500',
  interview: 'border-t-amber-500',
  offer:     'border-t-emerald-500',
  rejected:  'border-t-red-500',
}

export function KanbanPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeJob, setActiveJob] = useState<Job | null>(null)

  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await jobService.getKanban()
      setAllJobs(data)
    } catch {
      setError('Failed to load jobs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const grouped = useMemo(() => COLUMNS.reduce((acc, col) => {
    acc[col.id] = allJobs.filter(j => j.status === col.id)
    return acc
  }, {} as Record<string, Job[]>), [allJobs])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const job = event.active.data.current?.job as Job
    setActiveJob(job ?? null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveJob(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const job = active.data.current?.job as Job
    const newStatus = over.id as string
    if (!job || job.status === newStatus) return

    setAllJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus as Job['status'] } : j))

    try {
      await jobService.updateStatus(job.id, newStatus)
      const label = COLUMNS.find(c => c.id === newStatus)?.label ?? newStatus
      toast.success(`Moved to ${label}`)
    } catch {
      setAllJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: job.status } : j))
      toast.error('Failed to update job status.')
    }
  }

  const openView = (job: Job) => { setSelectedJob(job); setViewModalOpen(true) }
  const openEditFromView = () => { setViewModalOpen(false); setEditModalOpen(true) }
  const openCreate = () => { setSelectedJob(null); setEditModalOpen(true) }

  useKeyboardShortcuts({
    onNewJob: openCreate,
    onEscape: () => { if (viewModalOpen) setViewModalOpen(false); if (editModalOpen) setEditModalOpen(false) },
  })

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">
            {allJobs.length} application{allJobs.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Job
        </button>
      </motion.div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 h-[calc(100vh-220px)] overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const jobs = grouped[col.id] ?? []
            return (
              <DroppableColumn key={col.id} id={col.id} label={col.label} color={columnColors[col.id]}
                jobs={jobs} loading={loading} onView={openView} />
            )
          })}
        </div>

        <DragOverlay>
          {activeJob && (
            <div className="w-72 opacity-90">
              <KanbanCard job={activeJob} index={0} onView={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <JobViewModal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)}
        onEdit={openEditFromView} onDelete={() => { setViewModalOpen(false); fetchJobs() }}
        job={selectedJob} />
      <JobModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}
        onSaved={() => fetchJobs()} job={selectedJob} />
    </div>
  )
}

function DroppableColumn({ id, label, color, jobs, loading, onView }: {
  id: string; label: string; color: string
  jobs: Job[]; loading: boolean; onView: (job: Job) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div ref={setNodeRef}
      className={`flex-shrink-0 w-72 bg-surface border border-border rounded-xl border-t-2 ${color} flex flex-col transition-colors ${
        isOver ? 'bg-primary/5 border-primary/30' : ''
      }`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">{label}</span>
          <span className="text-[11px] font-medium text-slate-500 bg-surface2 px-1.5 py-0.5 rounded-full">
            {jobs.length}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[100px]">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Briefcase className="w-6 h-6 text-slate-600 mb-2" />
            <p className="text-xs text-slate-600">Drop jobs here</p>
          </div>
        ) : (
          jobs.map((job, i) => <KanbanCard key={job.id} job={job} index={i} onView={onView} />)
        )}
      </div>
    </div>
  )
}


