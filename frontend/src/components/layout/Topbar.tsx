import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Sun, Moon, X, LogOut, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { useSidebar } from '@/hooks/useSidebar'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/contexts/AuthContext'

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/billing': 'Billing',
  '/crm/contacts': 'CRM — Contacts',
  '/crm/pipeline': 'CRM — Pipeline',
  '/ai/chat': 'AI Chat',
  '/settings': 'Settings',
  '/help': 'Help',
  '/components': 'Components',
  '/jobs': 'Jobs',
  '/profile': 'Profile',
}

const notifications = [
  { id: '1', text: 'New enterprise deal closed', time: '2 min ago', unread: true },
  { id: '2', text: 'Sarah Kim upgraded to Pro', time: '18 min ago', unread: true },
  { id: '3', text: 'Revenue milestone: $250K MRR', time: '3 hours ago', unread: false },
]

export function Topbar() {
  const { toggle: toggleSidebar } = useSidebar()
  const { theme, toggle: toggleTheme } = useTheme()
  const location = useLocation()
  const navigate  = useNavigate()

  const { user, logout } = useAuth()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch]               = useState(false)
  const [showUserMenu, setShowUserMenu]           = useState(false)

  const unreadCount = notifications.filter(n => n.unread).length
  const pageTitle   = routeLabels[location.pathname] ?? 'Dashboard'

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? 'U'

  const handleLogout = async () => {
    await logout()
    navigate('/sign-in')
  }

  return (
    <header className="h-16 border-b border-orbit-border bg-orbit-surface/80 backdrop-blur-xl flex items-center px-6 gap-4 flex-shrink-0 relative z-30">
      {/* Left: hamburger + page title */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Orbit</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 font-medium">{pageTitle}</span>
      </div>

      {/* Right: actions */}
      <div className="ml-auto flex items-center gap-1">

        {/* Search */}
        <button
          onClick={() => setShowSearch(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(o => !o)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orbit-accent rounded-full ring-2 ring-orbit-surface" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-orbit-surface2 border border-orbit-border rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-orbit-border">
                    <p className="text-sm font-semibold text-slate-200">Notifications</p>
                    <span className="text-xs bg-orbit-primary/20 text-orbit-primary-light px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  </div>
                  <div className="divide-y divide-orbit-border">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors',
                          n.unread && 'bg-orbit-primary/5'
                        )}
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                          n.unread ? 'bg-orbit-accent' : 'bg-orbit-border2'
                        )} />
                        <div>
                          <p className="text-sm text-slate-200">{n.text}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-orbit-border">
                    <button className="text-xs text-orbit-primary-light hover:text-orbit-accent transition-colors">
                      Mark all as read
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User avatar + dropdown */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowUserMenu(o => !o)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
          >
            {userInitial}
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-orbit-surface2 border border-orbit-border rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-orbit-border">
                    <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    <button
                      onClick={() => { setShowUserMenu(false) }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl bg-orbit-surface2 border border-orbit-border rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-4 border-b border-orbit-border">
                <Search className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search jobs, companies..."
                  className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 outline-none text-sm"
                />
                <button onClick={() => setShowSearch(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">Quick Links</p>
                <div className="space-y-1">
                  {[
                    { label: 'Dashboard', path: '/dashboard' },
                    { label: 'Jobs', path: '/jobs' },
                  ].map(item => (
                    <div
                      key={item.path}
                      onClick={() => { navigate(item.path); setShowSearch(false) }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <span className="ml-auto text-xs text-slate-600">{item.path}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}