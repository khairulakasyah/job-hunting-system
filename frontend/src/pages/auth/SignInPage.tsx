import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [error, setError]               = useState('')

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-accent/8 blur-[100px] rounded-full" />
      </div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-border relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center glow-primary">
            <img src="/jobhunter-nobg.png" alt="JH" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-slate-100 font-semibold text-xl tracking-tight">Job Hunter</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-slate-100 mb-4 leading-tight">
            Your job hunt,{' '}
            <span className="text-gradient">beautifully organized</span>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            Track every application, company, and opportunity — all in one elegant interface.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'Track', label: 'Job Applications' },
              { value: 'Manage', label: 'Companies' },
              { value: 'Monitor', label: 'Progress' },
              { value: '100%', label: 'Free Forever' },
            ].map(stat => (
              <div key={stat.label} className="bg-surface/60 border border-border rounded-xl p-4">
                <p className="text-xl font-bold text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-700">
          Built with Laravel + React
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <img src="/jobhunter-nobg.png" alt="JH" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-slate-100 font-semibold text-lg">Job Hunter</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account to continue</p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              prefix={<Mail className="w-3.5 h-3.5" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              prefix={<Lock className="w-3.5 h-3.5" />}
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border bg-surface2 text-primary w-3.5 h-3.5" />
                <span className="text-xs text-slate-500">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-primary-light hover:text-accent transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-8">
            Don't have an account?{' '}
            <Link to="/sign-up" className="text-primary-light hover:text-accent transition-colors font-medium">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}