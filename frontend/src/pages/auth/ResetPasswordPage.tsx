import { useState } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { authService } from '@/services/authService'
import { toast } from 'sonner'

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    try {
      await authService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      toast.success('Password reset successfully. Please sign in.')
      navigate('/sign-in')
    } catch {
      toast.error(err.response?.data?.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-orbit-bg flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-orbit-primary/8 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-orbit-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="text-slate-100 font-semibold">Job Hunter</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-1">Set new password</h1>
        <p className="text-slate-500 text-sm mb-8">
          Choose a new password for your account
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            prefix={<Lock className="w-3.5 h-3.5" />}
            required
          />
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            prefix={<Lock className="w-3.5 h-3.5" />}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={passwordConfirmation}
            onChange={e => setPasswordConfirmation(e.target.value)}
            placeholder="Repeat new password"
            prefix={<Lock className="w-3.5 h-3.5" />}
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={loading} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
            Reset Password
          </Button>
        </form>

        <Link
          to="/sign-in"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </motion.div>
    </div>
  )
}
