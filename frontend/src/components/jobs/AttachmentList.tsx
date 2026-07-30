import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Paperclip, Download, Trash2, Upload, FileText, FileImage, FileArchive } from 'lucide-react'
import { toast } from 'sonner'
import { fileService, Attachment } from '@/services/fileService'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <FileImage className="w-5 h-5 text-sky-400" />
  if (mime.includes('pdf'))        return <FileText className="w-5 h-5 text-red-400" />
  if (mime.includes('zip'))        return <FileArchive className="w-5 h-5 text-amber-400" />
  return <Paperclip className="w-5 h-5 text-slate-400" />
}

export function AttachmentList({ jobId }: { jobId: number }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetch = async () => {
    try {
      const data = await fileService.getAttachments(jobId)
      setAttachments(data)
    } catch {
      toast.error('Failed to load attachments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [jobId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const attachment = await fileService.upload(jobId, file)
      setAttachments(prev => [attachment, ...prev])
    } catch {
      toast.error('Failed to upload file.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await fileService.delete(id)
      setAttachments(prev => prev.filter(a => a.id !== id))
    } catch {
      toast.error('Failed to delete attachment.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-12 bg-surface2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Attachments ({attachments.length})
        </h4>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.gif,.zip"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-light bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {attachments.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">No attachments yet.</p>
      )}

      <AnimatePresence>
        <div className="space-y-1.5">
          {attachments.map(a => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface2 hover:bg-white/5 transition-colors group"
            >
              <FileIcon mime={a.mime_type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{a.file_name}</p>
                <p className="text-xs text-slate-500">{formatSize(a.file_size)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={fileService.getDownloadUrl(a.id)}
                  download={a.file_name} aria-label={`Download ${a.file_name}`}
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(a.id)} aria-label="Delete attachment"
                  disabled={deleting === a.id}
                  className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  )
}
