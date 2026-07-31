import { useState } from 'react'
import { Mail, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { toast } from 'sonner'

export function EmailVerificationBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)

  if (!user || user.email_verified_at || dismissed) return null

  const handleResend = async () => {
    setResending(true)
    try {
      await authService.resendVerificationEmail()
      toast.success('Verification email sent. Check your inbox.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send verification email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 bg-primary/10 border-b border-primary/20 flex-shrink-0">
      <Mail className="w-4 h-4 text-primary-light flex-shrink-0" />
      <p className="text-xs text-slate-300 flex-1 min-w-0 truncate">
        Please verify your email address to secure your account.
      </p>
      <button
        onClick={handleResend}
        disabled={resending}
        className="flex items-center gap-1.5 text-xs font-medium text-primary-light hover:text-accent transition-colors disabled:opacity-50 flex-shrink-0"
      >
        {resending && <Loader2 className="w-3 h-3 animate-spin" />}
        Resend verification email
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
