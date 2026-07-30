import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface DeleteModalProps {
  isOpen:    boolean
  onClose:   () => void
  onConfirm: () => void
  loading:   boolean
  jobName:   string
}

const HOLD_DURATION = 2000

export function DeleteModal({ isOpen, onClose, onConfirm, loading, jobName }: DeleteModalProps) {
  const [holding, setHolding]     = useState(false)
  const [progress, setProgress]   = useState(0)
  const holdRef     = useRef<number>()
  const holdStarted = useRef(0)

  const startHold = () => {
    setHolding(true)
    setProgress(0)
    holdStarted.current = Date.now()
    const tick = () => {
      const elapsed = Date.now() - holdStarted.current
      const pct = Math.min(elapsed / HOLD_DURATION, 1)
      setProgress(pct)
      if (pct >= 1) {
        setHolding(false)
        setProgress(0)
        onConfirm()
        return
      }
      holdRef.current = requestAnimationFrame(tick)
    }
    holdRef.current = requestAnimationFrame(tick)
  }

  const cancelHold = () => {
    if (holdRef.current) cancelAnimationFrame(holdRef.current)
    setHolding(false)
    setProgress(0)
  }

  const circumference = 2 * Math.PI * 18
  const dashOffset    = circumference * (1 - progress)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="delete-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <motion.div key="delete-modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete Job</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Are you sure you want to delete{' '}
                  <span className="text-slate-300 font-medium">{jobName}</span>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="border-t border-orbit-border" />
              <div className="flex items-center gap-3 p-4">
                <button onClick={onClose} disabled={loading}
                  className="flex-1 py-2.5 bg-orbit-surface2 hover:bg-white/5 disabled:opacity-50 text-slate-400 text-sm font-medium rounded-lg border border-orbit-border transition-colors">
                  Cancel
                </button>
                <button
                  onPointerDown={startHold}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/90 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors relative overflow-hidden">
                  {holding ? (
                    <svg className="w-5 h-5" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                      <circle cx="20" cy="20" r="18" fill="none" stroke="white" strokeWidth="3"
                        strokeDasharray={circumference} strokeDashoffset={dashOffset}
                        strokeLinecap="round" transform="rotate(-90 20 20)" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  )}
                  {loading ? 'Deleting...' : holding ? 'Release to cancel' : 'Hold to Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}