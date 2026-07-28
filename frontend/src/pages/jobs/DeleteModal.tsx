import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeleteModalProps {
  isOpen:    boolean
  onClose:   () => void
  onConfirm: () => void
  loading:   boolean
  jobName:   string
}

export function DeleteModal({ isOpen, onClose, onConfirm, loading, jobName }: DeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="delete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="delete-modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-sm bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>

                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Delete Job
                </h3>

                <p className="text-sm text-slate-500 leading-relaxed">
                  Are you sure you want to delete{' '}
                  <span className="text-slate-300 font-medium">{jobName}</span>?
                  This action cannot be undone.
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-orbit-border" />

              {/* Buttons */}
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-orbit-surface2 hover:bg-white/5 disabled:opacity-50 text-slate-400 text-sm font-medium rounded-lg border border-orbit-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/90 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}