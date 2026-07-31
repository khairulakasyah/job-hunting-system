import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [name, setName]                 = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')

  const { register } = useAuth()
  const navigate     = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await register(name, email, password)
      toast.success('Account created successfully.')
      navigate('/dashboard')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-primary/8 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-accent/8 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
            <img src="/jobhunter-nobg.png" alt="JH" className="w-4 h-4 object-contain" />
          </div>
          <span className="text-slate-100 font-semibold">Job Hunter</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-1">Create your account</h1>
        <p className="text-slate-500 text-sm mb-8">Start tracking your job applications today</p>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="John Doe"
            prefix={<User className="w-3.5 h-3.5" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            prefix={<Mail className="w-3.5 h-3.5" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            prefix={<Lock className="w-3.5 h-3.5" />}
            hint="Use at least 8 characters"
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-border bg-surface2 text-primary w-3.5 h-3.5 flex-shrink-0"
              required
            />
            <span className="text-xs text-slate-500 leading-relaxed">
              I agree to the{' '}
              <a href="#" className="text-primary-light hover:text-accent transition-colors">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="text-primary-light hover:text-accent transition-colors">
                Privacy Policy
              </a>
            </span>
          </label>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-8">
          Already have an account?{' '}
          <Link
            to="/sign-in"
            className="text-primary-light hover:text-accent transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}