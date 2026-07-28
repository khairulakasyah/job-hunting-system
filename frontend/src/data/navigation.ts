import {
  LayoutDashboard,
  MessageSquare,
  Users,
  CreditCard,
  Puzzle,
  Settings,
  HelpCircle,
  BarChart3,
  Briefcase,
  UserCircle,
} from 'lucide-react'
import type { NavSection } from '@/types'

export const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      // { label: 'Analytics', icon: BarChart3, href: '/dashboard' },
    ],
  },
  {
    title: 'Job Hunting',
    items: [
      { label: 'Jobs', icon: Briefcase, href: '/jobs' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', icon: UserCircle, href: '/profile' },
    ],
  },
  {
    title: 'Apps',
    items: [
      { label: 'AI Chat', icon: MessageSquare, href: '/ai/chat', badge: 'New' },
      {
        label: 'CRM',
        icon: Users,
        children: [
          { label: 'Contacts', href: '/crm/contacts' },
          { label: 'Pipeline', href: '/crm/contacts' },
        ],
      },
      {
        label: 'Billing',
        icon: CreditCard,
        children: [
          { label: 'Overview', href: '/billing' },
          { label: 'Invoices', href: '/billing' },
        ],
      },
    ],
  },
  {
    title: 'Design System',
    items: [
      { label: 'Components', icon: Puzzle, href: '/components' },
      { label: 'Settings', icon: Settings, href: '/settings' },
      { label: 'Help', icon: HelpCircle, href: '/help' },
    ],
  },
]