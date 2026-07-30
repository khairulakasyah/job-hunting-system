import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { noteService, Note } from '@/services/noteService'

export function NotesPanel({ jobId }: { jobId: number }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetch = async () => {
    try {
      const data = await noteService.getNotes(jobId)
      setNotes(data)
    } catch {
      toast.error('Failed to load notes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [jobId])

  const handleCreate = async () => {
    if (!newContent.trim()) return
    setCreating(true)
    try {
      const note = await noteService.create(jobId, newContent.trim())
      setNotes(prev => [note, ...prev])
      setNewContent('')
    } catch {
      toast.error('Failed to create note.')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async (id: number) => {
    if (!editContent.trim()) return
    try {
      const updated = await noteService.update(id, { content: editContent.trim() })
      setNotes(prev => prev.map(n => n.id === id ? updated : n))
      setEditingId(null)
    } catch {
      toast.error('Failed to update note.')
    }
  }

  const handleTogglePin = async (note: Note) => {
    try {
      const updated = await noteService.update(note.id, { pinned: !note.pinned })
      setNotes(prev => {
        const mapped = prev.map(n => n.id === note.id ? updated : n)
        return mapped.sort((a, b) => Number(b.pinned) - Number(a.pinned))
      })
    } catch {
      toast.error('Failed to toggle pin.')
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await noteService.delete(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch {
      toast.error('Failed to delete note.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-surface2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Create */}
      <div className="mb-4">
        <textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="Write a note..."
          rows={3}
          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-primary transition-colors resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleCreate}
            disabled={creating || !newContent.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {creating ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* List */}
      {notes.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-6">No notes yet.</p>
      )}

      <AnimatePresence>
        <div className="space-y-2">
          {notes.map(note => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-lg border ${
                note.pinned
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-surface2 border-border'
              }`}
            >
              {editingId === note.id ? (
                <div className="p-3">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary transition-colors resize-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setEditingId(null)} aria-label="Cancel edit"
                      className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdate(note.id)} aria-label="Save note"
                      className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-600">
                      {new Date(note.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note)} aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                        className={`p-1 rounded-md transition-colors ${
                          note.pinned
                            ? 'text-primary-light'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingId(note.id); setEditContent(note.content) }} aria-label="Edit note"
                        className="p-1 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)} aria-label="Delete note"
                        disabled={deletingId === note.id}
                        className="p-1 rounded-md text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  )
}
