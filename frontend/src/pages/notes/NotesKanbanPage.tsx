import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, DragOverlay, useDroppable,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X, GripVertical, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { generalNoteService, NoteCategory, GeneralNote } from '@/services/generalNoteService'

const CATEGORY_COLORS = [
  '#4F46E5', '#0D9488', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#EC4899', '#64748B',
]

function SortableNoteCard({
  note,
  editingId,
  editTitle,
  editContent,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onChangeTitle,
  onChangeContent,
}: {
  note: GeneralNote
  editingId: number | null
  editTitle: string
  editContent: string
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onChangeTitle: (v: string) => void
  onChangeContent: (v: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `note-${note.id}`,
    data: { note },
  })

  const [expanded, setExpanded] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isEditing = editingId === note.id

  if (isEditing) {
    return (
      <div className="bg-orbit-surface2 border border-orbit-border rounded-lg p-3">
        <input
          value={editTitle}
          onChange={e => onChangeTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-orbit-surface border border-orbit-border rounded px-2 py-1 text-sm text-slate-200 outline-none focus:border-orbit-primary mb-2"
          autoFocus
        />
        <textarea
          value={editContent}
          onChange={e => onChangeContent(e.target.value)}
          placeholder="Content (optional)"
          rows={3}
          className="w-full bg-orbit-surface border border-orbit-border rounded px-2 py-1 text-sm text-slate-300 outline-none focus:border-orbit-primary resize-none mb-2"
        />
        <div className="flex items-center justify-between">
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-300">
            Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onCancelEdit} className="text-xs text-slate-500 hover:text-slate-300">
              Cancel
            </button>
            <button onClick={onSaveEdit}
              className="text-xs px-2 py-1 bg-orbit-primary text-white rounded-md hover:bg-orbit-primary/90">
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style}
      className="bg-orbit-surface2 border border-orbit-border rounded-lg p-3 hover:border-orbit-border2 group transition-colors overflow-hidden">
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners}
          onClick={e => e.stopPropagation()}
          className="mt-0.5 text-slate-600 hover:text-slate-400 transition-colors cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0 cursor-pointer break-words" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-medium text-slate-200 truncate ${!note.content ? '' : ''}`}>{note.title}</p>
            {note.content && (
              <button onClick={e => { e.stopPropagation(); setExpanded(!expanded) }} aria-label={expanded ? 'Collapse' : 'Expand'}
                className="shrink-0 text-slate-600 hover:text-slate-400 transition-colors">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
          {note.content && (
            <p className={`text-xs text-slate-500 mt-0.5 ${expanded ? '' : 'line-clamp-1'}`}>{note.content}</p>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); onStartEdit() }} aria-label="Edit note"
          className="shrink-0 mt-0.5 p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function Column({ category, notes, editingId, editTitle, editContent, adding, newTitle, newContent, isOver,
  onStartEdit, onSaveEdit, onCancelEdit, onDeleteNote, onChangeEditTitle, onChangeEditContent,
  onStartAdd, onAddNote, onCancelAdd, onChangeNewTitle, onChangeNewContent,
}: {
  category: NoteCategory
  notes: GeneralNote[]
  editingId: number | null
  editTitle: string
  editContent: string
  adding: boolean
  newTitle: string
  newContent: string
  isOver: boolean
  onStartEdit: (n: GeneralNote) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDeleteNote: (id: number) => void
  onChangeEditTitle: (v: string) => void
  onChangeEditContent: (v: string) => void
  onStartAdd: () => void
  onAddNote: () => void
  onCancelAdd: () => void
  onChangeNewTitle: (v: string) => void
  onChangeNewContent: (v: string) => void
}) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id: `col-${category.id}` })
  const noteIds = useMemo(() => notes.map(n => `note-${n.id}`), [notes])

  return (
    <div ref={setNodeRef}
      className={`flex flex-col bg-orbit-surface border border-orbit-border rounded-xl transition-colors ${
        isDroppableOver || isOver ? 'bg-orbit-primary/5 border-orbit-primary/30' : ''
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-orbit-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
          <span className="text-sm font-semibold text-slate-200">{category.name}</span>
          <span className="text-[11px] font-medium text-slate-500 bg-orbit-surface2 px-1.5 py-0.5 rounded-full">
            {notes.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[80px]">
        <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
          {notes.map(note => (
            <SortableNoteCard
              key={note.id}
              note={note}
              editingId={editingId}
              editTitle={editTitle}
              editContent={editContent}
              onStartEdit={() => onStartEdit(note)}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={() => onDeleteNote(note.id)}
              onChangeTitle={onChangeEditTitle}
              onChangeContent={onChangeEditContent}
            />
          ))}
        </SortableContext>

        {notes.length === 0 && !adding && (
          <p className="text-xs text-slate-600 text-center py-4">No notes yet</p>
        )}

        {/* Inline add form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="bg-orbit-surface2 border border-orbit-border rounded-lg p-3">
                <input
                  value={newTitle}
                  onChange={e => onChangeNewTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full bg-orbit-surface border border-orbit-border rounded px-2 py-1 text-sm text-slate-200 outline-none focus:border-orbit-primary mb-2"
                  autoFocus
                />
                <textarea
                  value={newContent}
                  onChange={e => onChangeNewContent(e.target.value)}
                  placeholder="Content (optional)"
                  rows={2}
                  className="w-full bg-orbit-surface border border-orbit-border rounded px-2 py-1 text-sm text-slate-300 outline-none focus:border-orbit-primary resize-none mb-2"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={onCancelAdd} className="text-xs text-slate-500 hover:text-slate-300">
                    Cancel
                  </button>
                  <button onClick={onAddNote} disabled={!newTitle.trim()}
                    className="text-xs px-2 py-1 bg-orbit-primary text-white rounded-md hover:bg-orbit-primary/90 disabled:opacity-40">
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add button */}
      {!adding && (
        <div className="px-3 pb-3 flex-shrink-0">
          <button onClick={onStartAdd}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors border border-dashed border-orbit-border">
            <Plus className="w-3.5 h-3.5" /> Add Note
          </button>
        </div>
      )}
    </div>
  )
}

export function NotesKanbanPage() {
  const [categories, setCategories] = useState<NoteCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [activeNote, setActiveNote] = useState<GeneralNote | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const [addingTo, setAddingTo] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState(CATEGORY_COLORS[0])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const fetchBoard = useCallback(async () => {
    try {
      const data = await generalNoteService.getBoard()
      setCategories(data)
    } catch {
      toast.error('Failed to load board.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBoard() }, [fetchBoard])

  // ── Drag handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    const note = event.active.data.current?.note as GeneralNote | undefined
    if (note) setActiveNote(note)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeNote = active.data.current?.note as GeneralNote | undefined
    const overId = String(over.id)

    // Determine target category id
    let targetCatId: number | null = null
    if (overId.startsWith('note-')) {
      const overNoteData = over.data.current?.note as GeneralNote | undefined
      targetCatId = overNoteData?.category_id ?? null
    } else if (overId.startsWith('col-')) {
      targetCatId = Number(overId.replace('col-', ''))
    }

    if (!activeNote || !targetCatId) return
    if (activeNote.category_id === targetCatId) return

    // Move note to different category optimistically
    setCategories(prev => {
      const srcCat = prev.find(c => c.id === activeNote.category_id)
      const dstCat = prev.find(c => c.id === targetCatId)
      if (!srcCat || !dstCat) return prev

      const note = srcCat.notes.find(n => n.id === activeNote.id)
      if (!note) return prev

      const newPos = dstCat.notes.length

      return prev.map(c => {
        if (c.id === srcCat.id) {
          return { ...c, notes: c.notes.filter(n => n.id !== note.id) }
        }
        if (c.id === dstCat.id) {
          return { ...c, notes: [...c.notes, { ...note, category_id: targetCatId!, position: newPos }] }
        }
        return c
      })
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveNote(null)
    if (!over || active.id === over.id) return

    const noteData = active.data.current?.note as GeneralNote | undefined
    if (!noteData) return

    const overId = String(over.id)
    let targetCatId: number | null = null
    let targetPosition = 0

    if (overId.startsWith('note-')) {
      const overNoteData = over.data.current?.note as GeneralNote | undefined
      if (!overNoteData) return
      targetCatId = overNoteData.category_id

      // Compute position within target category
      const cat = categories.find(c => c.id === targetCatId)
      if (!cat) return
      const overIdx = cat.notes.findIndex(n => n.id === overNoteData.id)
      targetPosition = overIdx >= 0 ? overIdx : cat.notes.length
    } else if (overId.startsWith('col-')) {
      targetCatId = Number(overId.replace('col-', ''))
      const cat = categories.find(c => c.id === targetCatId)
      targetPosition = cat ? cat.notes.length : 0
    }

    if (!targetCatId) return

    // Update local state for same-category reorder
    if (noteData.category_id === targetCatId) {
      setCategories(prev => prev.map(c => {
        if (c.id !== targetCatId) return c
        const notes = [...c.notes]
        const oldIdx = notes.findIndex(n => n.id === noteData.id)
        if (oldIdx === -1) return c
        notes.splice(oldIdx, 1)
        notes.splice(targetPosition, 0, noteData)
        return { ...c, notes }
      }))
    }

    // Build final order from current state
    const allNotes: { id: number; category_id: number; position: number }[] = []
    categories.forEach(c => {
      c.notes.forEach((n, i) => {
        allNotes.push({ id: n.id, category_id: n.category_id, position: i })
      })
    })

    try {
      await generalNoteService.moveNote(noteData.id, { category_id: targetCatId, position: targetPosition })
    } catch {
      toast.error('Failed to move note.')
      fetchBoard()
    }
  }

  // ── Note CRUD ──
  const handleStartAdd = (catId: number) => {
    setAddingTo(catId)
    setNewTitle('')
    setNewContent('')
  }

  const handleAddNote = async () => {
    if (!addingTo || !newTitle.trim()) return
    const optimistic: GeneralNote = {
      id: Date.now(),
      category_id: addingTo,
      title: newTitle.trim(),
      content: newContent.trim() || null,
      position: 999,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setCategories(prev => prev.map(c =>
      c.id === addingTo ? { ...c, notes: [...c.notes, optimistic] } : c
    ))
    setAddingTo(null)
    try {
      await generalNoteService.createNote({
        category_id: addingTo,
        title: newTitle.trim(),
        content: newContent.trim() || undefined,
      })
      fetchBoard()
    } catch {
      toast.error('Failed to create note.')
      fetchBoard()
    }
  }

  const handleStartEdit = (note: GeneralNote) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content ?? '')
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    try {
      await generalNoteService.updateNote(editingId, { title: editTitle, content: editContent })
      setCategories(prev => prev.map(c => ({
        ...c,
        notes: c.notes.map(n => n.id === editingId ? { ...n, title: editTitle, content: editContent } : n),
      })))
      setEditingId(null)
    } catch {
      toast.error('Failed to update note.')
    }
  }

  const handleCancelEdit = () => setEditingId(null)

  const handleDeleteNote = async (id: number) => {
    setCategories(prev => prev.map(c => ({
      ...c,
      notes: c.notes.filter(n => n.id !== id),
    })))
    try {
      await generalNoteService.deleteNote(id)
    } catch {
      toast.error('Failed to delete note.')
      fetchBoard()
    }
  }

  // ── Category CRUD ──
  const handleCreateCategory = async () => {
    if (!catName.trim()) return
    try {
      await generalNoteService.createCategory({ name: catName.trim(), color: catColor })
      setModalOpen(false)
      setCatName('')
      fetchBoard()
    } catch {
      toast.error('Failed to create column.')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="h-[calc(100vh-220px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-orbit-surface rounded-xl animate-pulse h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Notes</h1>
          <p className="text-slate-500 text-sm mt-1">Kanban board for your notes</p>
        </div>
        <button onClick={() => { setCatName(''); setCatColor(CATEGORY_COLORS[0]); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-orbit-primary hover:bg-orbit-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Column
        </button>
      </motion.div>

      {/* Board */}
      {categories.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-slate-500 mb-4">No columns yet. Create your first one!</p>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="h-[calc(100vh-220px)] overflow-y-auto pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {categories.map(cat => (
                <Column
                  key={cat.id}
                  category={cat}
                  notes={cat.notes}
                  editingId={editingId}
                  editTitle={editTitle}
                  editContent={editContent}
                  adding={addingTo === cat.id}
                  newTitle={newTitle}
                  newContent={newContent}
                  isOver={false}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onDeleteNote={handleDeleteNote}
                  onChangeEditTitle={setEditTitle}
                  onChangeEditContent={setEditContent}
                  onStartAdd={() => handleStartAdd(cat.id)}
                  onAddNote={handleAddNote}
                  onCancelAdd={() => setAddingTo(null)}
                  onChangeNewTitle={setNewTitle}
                  onChangeNewContent={setNewContent}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeNote && (
              <div className="w-72 opacity-90">
                <div className="bg-orbit-surface2 border border-orbit-border rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-200">{activeNote.title}</p>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Create Category Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div key="cat-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div key="cat-modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div role="dialog" aria-modal="true" className="w-full max-w-md bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl pointer-events-auto"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border">
                  <p className="text-sm font-semibold text-slate-200">New Column</p>
                  <button onClick={() => setModalOpen(false)} aria-label="Close"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
                    <input type="text" value={catName} onChange={e => setCatName(e.target.value)}
                      placeholder="e.g. To Do, Interview Notes, Ideas"
                      className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors"
                      autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2.5">Color</label>
                    <div className="flex gap-2.5 flex-wrap">
                      {CATEGORY_COLORS.map(c => (
                        <button key={c} onClick={() => setCatColor(c)}
                          className={`w-7 h-7 rounded-full transition-all ${
                            catColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-orbit-surface scale-110' : ''
                          }`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-orbit-border flex items-center gap-3">
                  <button onClick={handleCreateCategory} disabled={!catName.trim()}
                    className="flex-1 py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    Create Column
                  </button>
                  <button onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 bg-orbit-surface2 hover:bg-white/5 text-slate-400 text-sm font-medium rounded-lg border border-orbit-border transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
