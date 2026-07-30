import { useEffect, useState } from 'react'
import { Plus, Calendar, Video } from 'lucide-react'
import { toast } from 'sonner'
import { JobTimeline } from '@/services/jobTimelineService'
import { noteService } from '@/services/noteService'
import { EventModal } from '@/pages/jobs/EventModal'

const eventTypeLabels: Record<string, string> = {
  interview: 'Interview', phone_screen: 'Phone Screen', technical_test: 'Technical Test',
  follow_up: 'Follow-up', offer_deadline: 'Offer Deadline', assessment: 'Assessment',
  networking: 'Networking', other: 'Other',
}

interface Props {
  jobId: number
  timelines: JobTimeline[]
  onTimelineReload: () => void
}

export function InterviewPrepTab({ jobId, timelines, onTimelineReload }: Props) {
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [prepNotes, setPrepNotes] = useState('')
  const [prepNoteId, setPrepNoteId] = useState<number | null>(null)
  const [prepLoading, setPrepLoading] = useState(false)
  const [prepSaving, setPrepSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setPrepLoading(true)
      try {
        const notes = await noteService.getNotes(jobId)
        if (!cancelled) {
          const prep = notes.find(n => n.pinned) ?? notes[0]
          if (prep) { setPrepNotes(prep.content); setPrepNoteId(prep.id) }
        }
      } catch {
        if (!cancelled) toast.error('Failed to load prep notes.')
      } finally {
        if (!cancelled) setPrepLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [jobId])

  const timelineEvents = timelines.filter(t => t.scheduled_at) ?? []
  const upcomingEvents = timelineEvents.filter(t => new Date(t.scheduled_at!) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
  const pastEvents = timelineEvents.filter(t => new Date(t.scheduled_at!) < new Date())
    .sort((a, b) => new Date(b.scheduled_at!).getTime() - new Date(a.scheduled_at!).getTime())

  const handleSavePrepNotes = async () => {
    if (!prepNotes.trim()) return
    setPrepSaving(true)
    try {
      if (prepNoteId) {
        const updated = await noteService.update(prepNoteId, { content: prepNotes.trim() })
        setPrepNoteId(updated.id)
      } else {
        const created = await noteService.create(jobId, prepNotes.trim(), true)
        setPrepNoteId(created.id)
      }
    } catch { toast.error('Failed to save prep notes.') }
    finally { setPrepSaving(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Events</p>
        <button onClick={() => setEventModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Schedule Event
        </button>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-600">No events scheduled</p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingEvents.map(ev => (
            <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary-light flex items-center justify-center flex-shrink-0">
                {ev.meeting_link ? <Video className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{eventTypeLabels[ev.event_type ?? ''] ?? ev.stage}</p>
                <p className="text-xs text-slate-500">{new Date(ev.scheduled_at!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                {ev.location && <p className="text-[11px] text-slate-600 mt-0.5">{ev.location}</p>}
                {ev.meeting_link && (
                  <a href={ev.meeting_link} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-primary-light hover:text-accent transition-colors inline-block mt-0.5 truncate max-w-full">{ev.meeting_link}</a>
                )}
              </div>
            </div>
          ))}
          {pastEvents.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider pt-2">Past</p>
              {pastEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface2 border border-border opacity-60">
                  <div className="w-8 h-8 rounded-lg bg-surface3 flex items-center justify-center flex-shrink-0 text-slate-500"><Calendar className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-400">{eventTypeLabels[ev.event_type ?? ''] ?? ev.stage}</p>
                    <p className="text-xs text-slate-600">{new Date(ev.scheduled_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Preparation Notes</p>
        {prepLoading ? (
          <div className="h-24 bg-surface2 rounded-lg animate-pulse" />
        ) : (
          <>
            <textarea value={prepNotes} onChange={e => setPrepNotes(e.target.value)}
              placeholder="Write your interview prep notes here..."
              rows={6}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-primary transition-colors resize-none" />
            <div className="flex justify-end mt-2">
              <button onClick={handleSavePrepNotes} disabled={prepSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-lg transition-colors">
                {prepSaving ? 'Saving...' : prepNoteId ? 'Update Notes' : 'Save Notes'}
              </button>
            </div>
          </>
        )}
      </div>

      <EventModal isOpen={eventModalOpen} onClose={() => setEventModalOpen(false)}
        onSaved={() => onTimelineReload()}
        prefilledDate={new Date().toISOString().split('T')[0]} />
    </div>
  )
}
