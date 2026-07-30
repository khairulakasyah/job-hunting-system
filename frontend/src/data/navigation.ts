import {
  LayoutDashboard,
  Briefcase,
  UserCircle,
  Kanban,
  CalendarDays,
  FileText,
  StickyNote,
  DollarSign,
} from 'lucide-react'
import type { NavSection } from '@/types'

export const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    title: 'Job Hunting',
    items: [
      { label: 'Jobs', icon: Briefcase, href: '/jobs' },
      { label: 'Pipeline', icon: Kanban, href: '/jobs/pipeline' },
      { label: 'Calendar', icon: CalendarDays, href: '/jobs/calendar' },
      { label: 'Offers', icon: DollarSign, href: '/jobs/offers' },
      { label: 'Email Templates', icon: FileText, href: '/jobs/email-templates' },
    ],
  },
  {
    title: 'Notes',
    items: [
      { label: 'Kanban Board', icon: StickyNote, href: '/notes' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', icon: UserCircle, href: '/profile' },
    ],
  },
]
