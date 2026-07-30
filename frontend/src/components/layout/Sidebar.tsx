import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { navigation } from '@/data/navigation'
import { useSidebar } from '@/hooks/useSidebar'
import type { NavItem } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

function OrbitLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-5 border-b border-orbit-border">
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-orbit-primary flex items-center justify-center glow-primary">
          <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
            <circle cx="16" cy="16" r="4" fill="white" />
            <ellipse cx="16" cy="16" rx="11" ry="5" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" transform="rotate(-30 16 16)" />
            <circle cx="23" cy="11" r="2" fill="#0D9488" />
          </svg>
        </div>
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <span className="text-slate-100 font-semibold text-lg tracking-tight whitespace-nowrap">
              Job Hunter
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavItemLink({
  item,
  collapsed,
  onNavClick,
}: {
  item: NavItem
  collapsed: boolean
  onNavClick: () => void
}) {
  const location = useLocation()
  const [open, setOpen] = useState(() =>
    item.children?.some(c => location.pathname === c.href) ?? false
  )
  const hasChildren = item.children && item.children.length > 0
  const isActive = item.href ? location.pathname === item.href : false
  const isChildActive = item.children?.some(c => location.pathname === c.href) ?? false

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
            isChildActive
              ? 'text-slate-100 bg-orbit-primary/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          )}
        >
          {item.icon && (
            <item.icon
              className={cn(
                'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                isChildActive ? 'text-orbit-primary-light' : 'text-slate-500 group-hover:text-slate-300'
              )}
            />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-left truncate"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && (
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </motion.div>
          )}
        </button>

        <AnimatePresence>
          {open && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-6 mt-1 border-l border-orbit-border pl-3 space-y-0.5">
                {item.children!.map(child => (
                  <NavLink
                    key={child.href}
                    to={child.href}
                    onClick={onNavClick}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                        isActive
                          ? 'text-orbit-primary-light font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      )
                    }
                  >
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    {child.label}
                    {child.badge && (
                      <span className="ml-auto text-[10px] font-semibold bg-orbit-primary/20 text-orbit-primary-light px-1.5 py-0.5 rounded-full">
                        {child.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <NavLink
      to={item.href!}
      end={item.href === '/jobs'}
      onClick={onNavClick}
      className={({ isActive: routerActive }) => {
        const active = routerActive || isActive
        return cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
          active
            ? 'text-slate-100 bg-orbit-primary/15 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        )
      }}
    >
      {({ isActive: routerActive }) => {
        const active = routerActive || isActive
        return (
          <>
            {active && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orbit-primary rounded-r-full"
              />
            )}
            {item.icon && (
              <item.icon
                className={cn(
                  'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                  active ? 'text-orbit-primary-light' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {!collapsed && item.badge && (
              <span className="ml-auto text-[10px] font-bold bg-orbit-accent/20 text-orbit-accent-light px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )
      }}
    </NavLink>
  )
}

export function Sidebar() {
  const { user } = useAuth()
  const { collapsed, isMobile, mobileOpen, closeMobile } = useSidebar()

  const onNavClick = () => {
    if (isMobile) closeMobile()
  }

  return (
    <motion.aside
      animate={{
        width: isMobile ? 256 : (collapsed ? 72 : 256),
        x: isMobile && !mobileOpen ? '-100%' : 0,
      }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-orbit-surface border-r border-orbit-border flex flex-col z-40 overflow-hidden"
    >
      <OrbitLogo collapsed={collapsed && !isMobile} />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6">
        {navigation.map(section => (
          <div key={section.title}>
            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 mb-2"
                >
                  {section.title}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavItemLink
                  key={item.label}
                  item={item}
                  collapsed={collapsed && !isMobile}
                  onNavClick={onNavClick}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-orbit-border p-3">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors',
          collapsed && !isMobile && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name ?? 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email ?? ''}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
