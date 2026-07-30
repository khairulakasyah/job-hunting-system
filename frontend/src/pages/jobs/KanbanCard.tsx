import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { Building2, MapPin, DollarSign, GripVertical } from 'lucide-react'
import { Job } from '@/services/jobService'

interface KanbanCardProps {
  job: Job
  index: number
  onView: (job: Job) => void
}

const platformColors: Record<string, string> = {
  linkedin: 'text-blue-400',
  indeed: 'text-indigo-400',
  jobstreet: 'text-emerald-400',
  hiredly: 'text-cyan-400',
}

export function KanbanCard({ job, index, onView }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `job-${job.id}`,
    data: { job },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      ref={setNodeRef}
      style={style}
      className={`bg-surface2 border border-border rounded-xl p-3.5 cursor-pointer group transition-all ${
        isDragging ? 'opacity-50 shadow-2xl scale-105' : 'hover:border-border2 hover:shadow-md'
      }`}
      onClick={() => !isDragging && onView(job)}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners}
          className="mt-0.5 text-slate-600 hover:text-slate-400 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">{job.job_title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <p className="text-[11px] text-slate-400 truncate">{job.company_name}</p>
          </div>
          {job.location && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <p className="text-[11px] text-slate-500 truncate">{job.location}</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            {job.salary ? (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-400">{job.salary}</span>
              </div>
            ) : (
              <span />
            )}
            <span className={`text-[10px] font-medium capitalize ${platformColors[job.job_platform] ?? 'text-slate-500'}`}>
              {job.job_platform}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
