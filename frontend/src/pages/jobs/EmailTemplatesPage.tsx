import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Plus, Pencil, Trash2, X, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { emailTemplateService, EmailTemplate, EmailTemplateForm } from '@/services/emailTemplateService'

const emptyForm: EmailTemplateForm = { name: '', subject: '', body: '' }

export function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState<EmailTemplateForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fetch = async () => {
    try {
      const data = await emailTemplateService.getAll()
      setTemplates(data)
    } catch {
      toast.error('Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (t: EmailTemplate) => {
    setEditing(t)
    setForm({ name: t.name, subject: t.subject, body: t.body, variables: t.variables ?? undefined })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      if (editing) {
        const updated = await emailTemplateService.update(editing.id, form)
        setTemplates(prev => prev.map(t => t.id === editing.id ? updated : t))
      } else {
        const created = await emailTemplateService.create(form)
        setTemplates(prev => [created, ...prev])
      }
      setModalOpen(false)
    } catch {
      toast.error('Failed to save template.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await emailTemplateService.delete(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch {
      toast.error('Failed to delete template.')
    }
  }

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } catch {
      toast.error('Failed to copy.')
    }
  }

  const hintVars = ['{{company_name}}', '{{job_title}}', '{{candidate_name}}', '{{location}}', '{{salary}}']

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Email Templates</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your email templates</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orbit-primary hover:bg-orbit-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Template
        </button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-orbit-surface rounded-xl animate-pulse" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-orbit-surface2 flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-slate-500" />
          </div>
          <p className="text-slate-300 font-medium">No templates yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">Create email templates to speed up your outreach</p>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-orbit-primary hover:bg-orbit-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="bg-orbit-surface border border-orbit-border rounded-xl p-5 hover:border-orbit-border2 transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-200">{t.name}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} aria-label="Edit template"
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} aria-label="Delete template"
                    className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-1.5 truncate">{t.subject}</p>
              <p className="text-xs text-slate-600 line-clamp-2">{t.body}</p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-orbit-border">
                <button onClick={() => handleCopy(t.subject, `${t.id}-subject`)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors">
                  <Copy className="w-3 h-3" />
                  {copiedKey === `${t.id}-subject` ? 'Copied!' : 'Copy Subject'}
                </button>
                <button onClick={() => handleCopy(t.body, `${t.id}-body`)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors">
                  <Copy className="w-3 h-3" />
                  {copiedKey === `${t.id}-body` ? 'Copied!' : 'Copy Body'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div key="tmpl-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div key="tmpl-modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div role="dialog" aria-modal="true" className="w-full max-w-xl bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl pointer-events-auto"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border">
                  <p className="text-sm font-semibold text-slate-200">
                    {editing ? 'Edit Template' : 'New Template'}
                  </p>
                  <button onClick={() => setModalOpen(false)} aria-label="Close"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Interview Invitation"
                      className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Subject <span className="text-red-400">*</span></label>
                    <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="e.g. Interview Invitation - {{company_name}}"
                      className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-400">Body <span className="text-red-400">*</span></label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-600">Insert:</span>
                        {hintVars.map(v => (
                          <button key={v} type="button" onClick={() => setForm(f => ({ ...f, body: f.body + v }))}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-orbit-surface3 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors">
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                      rows={8} placeholder="Dear {{candidate_name}},..."
                      className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors resize-none" />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-orbit-border flex items-center gap-3">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    {saving ? 'Saving...' : editing ? 'Update Template' : 'Create Template'}
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
