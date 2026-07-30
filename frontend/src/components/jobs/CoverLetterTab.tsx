import { useState } from 'react'
import { toast } from 'sonner'
import { aiService } from '@/services/aiService'

interface Props {
  jobId: number
}

export function CoverLetterTab({ jobId }: Props) {
  const [coverLetter, setCoverLetter] = useState('')
  const [coverLoading, setCoverLoading] = useState(false)

  const generate = async () => {
    setCoverLoading(true)
    setCoverLetter('')
    try { const text = await aiService.generateCoverLetter(jobId); setCoverLetter(text) }
    catch { toast.error('Failed to generate cover letter.') }
    finally { setCoverLoading(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI-Generated Cover Letter</p>
        {coverLetter && (
          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard.writeText(coverLetter); toast.success('Copied to clipboard') }}
              className="px-3 py-1.5 bg-surface2 hover:bg-white/5 text-slate-400 text-xs font-medium rounded-lg border border-border transition-colors">Copy</button>
            <button onClick={generate}
              className="px-3 py-1.5 bg-surface2 hover:bg-white/5 text-slate-400 text-xs font-medium rounded-lg border border-border transition-colors">Regenerate</button>
          </div>
        )}
      </div>

      {!coverLetter && !coverLoading && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm mb-4">Generate a professional cover letter based on the job description and your profile</p>
          <button onClick={generate}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">Generate Cover Letter</button>
        </div>
      )}

      {coverLoading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-surface2 rounded w-full" />
          <div className="h-4 bg-surface2 rounded w-5/6" />
          <div className="h-4 bg-surface2 rounded w-4/6" />
          <div className="h-4 bg-surface2 rounded w-full" />
          <div className="h-4 bg-surface2 rounded w-3/6" />
        </div>
      )}

      {coverLetter && !coverLoading && (
        <div className="bg-surface2 border border-border rounded-xl p-5">
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{coverLetter}</p>
        </div>
      )}
    </div>
  )
}
