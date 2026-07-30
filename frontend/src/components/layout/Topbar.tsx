import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, X, LogOut, User, Briefcase, StickyNote, FileText, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { useSidebar } from '@/hooks/useSidebar'
import { searchService, type SearchResults } from '@/services/searchService'

import { useAuth } from '@/contexts/AuthContext'

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs',
  '/jobs/pipeline': 'Pipeline',
  '/jobs/calendar': 'Calendar',
  '/jobs/offers': 'Offers',
  '/jobs/email-templates': 'Email Templates',
  '/notes': 'Notes',
  '/profile': 'Profile',
}

const notifications: { id: string; text: string; time: string; unread: boolean }[] = []

export function Topbar() {
  const { toggle: toggleSidebar } = useSidebar()
  const location = useLocation()
  const navigate  = useNavigate()

  const { user, logout } = useAuth()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch]               = useState(false)
  const [showUserMenu, setShowUserMenu]           = useState(false)

  const [searchQuery, setSearchQuery]             = useState('')
  const [searchResults, setSearchResults]         = useState<SearchResults | null>(null)
  const [searchLoading, setSearchLoading]         = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return }
    setSearchLoading(true)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await searchService.search(searchQuery.trim())
        setSearchResults(data)
      } catch { /* silent */ }
      setSearchLoading(false)
    }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [searchQuery])

  const handleSearchClose = () => {
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults(null)
  }

  const unreadCount = notifications.filter(n => n.unread).length
  const pageTitle   = routeLabels[location.pathname] ?? 'Dashboard'

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? 'U'

  const handleLogout = async () => {
    await logout()
    navigate('/sign-in')
  }

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-xl flex items-center px-6 gap-4 flex-shrink-0 relative z-30">
      {/* Left: hamburger + page title */}
      <button
        onClick={toggleSidebar} aria-label="Toggle sidebar"
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-500 flex-shrink-0">Job Hunter</span>
          <span className="text-slate-600 flex-shrink-0">/</span>
          <span className="text-slate-200 font-medium truncate">{pageTitle}</span>
        </div>

      {/* Right: actions */}
      <div className="ml-auto flex items-center gap-1">

        {/* Search */}
        <div className="relative">
          <button
            onClick={() => setShowSearch(o => !o)} aria-label="Open search"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showSearch && (
              <>
                <div className="fixed inset-0 z-40" onClick={handleSearchClose} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-96 bg-surface2 border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                    <Search className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search jobs, companies..."
                      className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 outline-none text-sm"
                    />
                    {searchLoading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
                    <button onClick={handleSearchClose} aria-label="Close search" className="text-slate-500 hover:text-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-4 py-3 max-h-80 overflow-y-auto">
                    {!searchQuery.trim() ? (
                      <>
                        <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">Quick Links</p>
                        <div className="space-y-1">
                          {[
                            { label: 'Dashboard', path: '/dashboard' },
                            { label: 'Jobs', path: '/jobs' },
                            { label: 'Pipeline', path: '/jobs/pipeline' },
                            { label: 'Calendar', path: '/jobs/calendar' },
                          ].map(item => (
                            <div key={item.path}
                              onClick={() => { navigate(item.path); setShowSearch(false) }}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                              <span className="text-sm text-slate-300">{item.label}</span>
                              <span className="ml-auto text-xs text-slate-600">{item.path}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : !searchResults ? null : (
                      <div className="space-y-4">
                        {searchResults.jobs.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3" /> Jobs
                            </p>
                            {searchResults.jobs.map(job => (
                              <div key={job.id}
                                onClick={() => { navigate('/jobs'); setShowSearch(false) }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                                <span className="text-sm text-slate-200">{job.job_title}</span>
                                <span className="text-xs text-slate-500">@{job.company_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {searchResults.notes.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                              <StickyNote className="w-3 h-3" /> Notes
                            </p>
                            {searchResults.notes.map(note => (
                              <div key={note.id}
                                onClick={() => { navigate('/notes'); setShowSearch(false) }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                                <span className="text-sm text-slate-200">{note.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {searchResults.templates.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                              <FileText className="w-3 h-3" /> Email Templates
                            </p>
                            {searchResults.templates.map(t => (
                              <div key={t.id}
                                onClick={() => { navigate('/jobs/email-templates'); setShowSearch(false) }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                                <span className="text-sm text-slate-200">{t.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {!searchResults.jobs.length && !searchResults.notes.length && !searchResults.templates.length && (
                          <p className="text-sm text-slate-500 text-center py-6">No results found</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(o => !o)} aria-label="Toggle notifications"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-surface" />
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
                  className="absolute right-0 top-full mt-2 w-80 bg-surface2 border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-slate-200">Notifications</p>
                    <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors',
                          n.unread && 'bg-primary/5'
                        )}
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                          n.unread ? 'bg-accent' : 'bg-border2'
                        )} />
                        <div>
                          <p className="text-sm text-slate-200">{n.text}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-border">
                    <button className="text-xs text-primary-light hover:text-accent transition-colors">
                      Mark all as read
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar + dropdown */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowUserMenu(o => !o)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
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
                  className="absolute right-0 top-full mt-2 w-56 bg-surface2 border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/profile') }}
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


    </header>
  )
}
