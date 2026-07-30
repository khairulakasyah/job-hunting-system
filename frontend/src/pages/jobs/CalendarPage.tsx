import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventSourceInput } from '@fullcalendar/core'
import { eventService, CalendarEvent } from '@/services/eventService'
import { EventModal } from './EventModal'
import { JobViewModal } from './JobViewModal'
import { jobService, Job } from '@/services/jobService'

const eventTypeColors: Record<string, string> = {
  interview:     '#F59E0B',
  phone_screen:  '#3B82F6',
  technical_test: '#6366F1',
  follow_up:     '#0D9488',
  offer_deadline: '#10B981',
  assessment:    '#4F46E5',
  networking:    '#EC4899',
  other:         '#64748B',
}

function formatEvents(data: CalendarEvent[]): EventSourceInput {
  return data.map((e: CalendarEvent) => ({
    id: String(e.id),
    title: e.title,
    start: e.start,
    allDay: e.allDay,
    backgroundColor: eventTypeColors[e.extendedProps.event_type] ?? '#64748B',
    borderColor: eventTypeColors[e.extendedProps.event_type] ?? '#64748B',
    textColor: '#fff',
    extendedProps: e.extendedProps,
  }))
}

export function CalendarPage() {
  const calendarContainerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<Calendar | null>(null)
  const [viewRange, setViewRange] = useState({ from: '', to: '' })
  const [events, setEvents] = useState<EventSourceInput>([])

  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<any>(null)
  const [prefilledDate, setPrefilledDate] = useState<string>()

  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const fetchEvents = useCallback(async (from: string, to: string) => {
    try {
      const data = await eventService.getEvents(from, to)
      setEvents(formatEvents(data))
    } catch {
      // silent fetch — calendar shows no events
    }
  }, [])

  const handleDatesSet = useCallback((arg: { start: Date; end: Date }) => {
    const from = arg.start.toISOString().split('T')[0]
    const to = arg.end.toISOString().split('T')[0]
    setViewRange({ from, to })
    fetchEvents(from, to)
  }, [fetchEvents])

  // Initialize calendar once
  useEffect(() => {
    const el = calendarContainerRef.current
    if (!el || calendarRef.current) return

    const calendar = new Calendar(el, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      },
      height: 'auto',
      contentHeight: 'auto',
      aspectRatio: 1.8,
      firstDay: 1,
      nowIndicator: true,
      slotMinTime: '08:00:00',
      slotMaxTime: '20:00:00',
      allDaySlot: false,
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      },
      datesSet: handleDatesSet,
      dateClick: (arg) => {
        setEditEvent(null)
        setPrefilledDate(arg.dateStr)
        setEventModalOpen(true)
      },
      eventClick: (arg) => {
        const jobId = arg.event.extendedProps.job_id
        if (jobId) {
          jobService.getOne(jobId).then(job => {
            setSelectedJob(job)
            setViewModalOpen(true)
          }).catch(() => {})
        }
      },
    })

    calendar.render()
    calendarRef.current = calendar

    return () => {
      calendar.destroy()
      calendarRef.current = null
    }
  }, [handleDatesSet])

  // Update events when they change
  useEffect(() => {
    const cal = calendarRef.current
    if (!cal) return
    cal.removeAllEvents()
    if (Array.isArray(events) && events.length > 0) {
      cal.addEventSource(events)
    }
  }, [events])

  const openCreateEvent = () => {
    setEditEvent(null)
    setPrefilledDate(undefined)
    setEventModalOpen(true)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your interviews and events</p>
        </div>
        <button onClick={openCreateEvent}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-surface border border-border rounded-xl p-4">
        <div className="calendar-container" ref={calendarContainerRef} />
      </motion.div>

      <style>{`
        .calendar-container .fc {
          --fc-border-color: var(--border);
          --fc-page-bg-color: var(--bg);
          --fc-neutral-bg-color: var(--surface2);
          --fc-today-bg-color: rgba(79, 70, 229, 0.08);
          --fc-list-event-hover-bg-color: var(--hover-bg);
          --fc-event-bg-color: #4F46E5;
          --fc-event-border-color: #4F46E5;
          --fc-event-text-color: #fff;
          --fc-more-link-bg-color: rgba(79, 70, 229, 0.15);
          --fc-more-link-text-color: #6366F1;
          font-family: inherit;
        }
        .calendar-container .fc .fc-toolbar {
          background: transparent;
        }
        .calendar-container .fc .fc-toolbar-title {
          color: var(--text-primary);
          font-size: 1.1rem;
          font-weight: 600;
        }
        .calendar-container .fc .fc-scrollgrid-section-header td,
        .calendar-container .fc .fc-scrollgrid-section-header {
          background: var(--surface);
        }
        .calendar-container .fc .fc-col-header,
        .calendar-container .fc .fc-col-header-cell {
          background: var(--surface);
        }
        .calendar-container .fc .fc-button {
          background: var(--surface2);
          border-color: var(--border);
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.3rem 0.6rem;
          border-radius: 0.5rem;
          text-transform: capitalize;
        }
        .calendar-container .fc .fc-button:hover {
          background: var(--hover-bg);
          border-color: var(--border2);
          color: var(--text-primary);
        }
        .calendar-container .fc .fc-button-active {
          background: #4F46E5 !important;
          border-color: #4F46E5 !important;
          color: #fff !important;
        }
        .calendar-container .fc .fc-button-primary:not(:disabled).fc-button-active {
          background: #4F46E5 !important;
          border-color: #4F46E5 !important;
        }
        .calendar-container .fc .fc-daygrid-day-number {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 500;
        }
        .calendar-container .fc .fc-col-header-cell-cushion {
          color: var(--text-subtle);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .calendar-container .fc .fc-daygrid-day.fc-day-today {
          background: rgba(79, 70, 229, 0.08);
        }
        .calendar-container .fc .fc-daygrid-day.fc-day-other {
          opacity: 0.3;
        }
        .calendar-container .fc .fc-timegrid-slot {
          height: 2rem;
        }
        .calendar-container .fc .fc-timegrid-axis-cushion {
          color: var(--text-subtle);
          font-size: 0.7rem;
        }
        .calendar-container .fc .fc-event {
          border-radius: 0.4rem;
          padding: 0.15rem 0.3rem;
          font-size: 0.75rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
        }
        .calendar-container .fc .fc-event:hover {
          filter: brightness(1.15);
        }
        .calendar-container .fc .fc-more-link {
          font-size: 0.7rem;
          font-weight: 600;
        }
        .calendar-container .fc .fc-popover {
          background: var(--surface2);
          border-color: var(--border);
          border-radius: 0.75rem;
        }
        .calendar-container .fc .fc-popover-header {
          background: var(--surface);
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .calendar-container .fc .fc-popover-title {
          color: var(--text-primary);
          font-size: 0.8rem;
        }
        .calendar-container .fc .fc-popover-close {
          color: var(--text-subtle);
        }
        .calendar-container .fc .fc-more-popover .fc-daygrid-event {
          margin: 0.2rem 0;
        }
      `}</style>

      <EventModal
        isOpen={eventModalOpen}
        onClose={() => { setEventModalOpen(false); setEditEvent(null) }}
        onSaved={() => {
          if (viewRange.from && viewRange.to) {
            fetchEvents(viewRange.from, viewRange.to)
          }
        }}
        event={editEvent}
        prefilledDate={prefilledDate}
      />

      <JobViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        onEdit={() => { setViewModalOpen(false); setEditEvent(null) }}
        onDelete={() => setViewModalOpen(false)}
        job={selectedJob}
      />
    </div>
  )
}
