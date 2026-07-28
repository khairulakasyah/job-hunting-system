import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Save, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'

export function ProfilePage() {
  const { user, updateUser } = useAuth()

  // Profile form
  const [name, setName]             = useState(user?.name  ?? '')
  const [email, setEmail]           = useState(user?.email ?? '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError]     = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword]   = useState('')
  const [newPassword, setNewPassword]           = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [showCurrent, setShowCurrent]           = useState(false)
  const [showNew, setShowNew]                   = useState(false)
  const [showConfirm, setShowConfirm]           = useState(false)
  const [passwordLoading, setPasswordLoading]   = useState(false)
  const [passwordError, setPasswordError]       = useState('')
  const [passwordSuccess, setPasswordSuccess]   = useState('')

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      const updatedUser = await authService.updateProfile({ name, email })
      updateUser(updatedUser)
      setProfileSuccess('Profile updated successfully.')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile.'
      setProfileError(message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      await authService.changePassword({
        current_password:          currentPassword,
        new_password:              newPassword,
        new_password_confirmation: confirmPassword,
      })
      setPasswordSuccess('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to change password.'
      setPasswordError(message)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-slate-100">Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account information</p>
      </motion.div>

      {/* Avatar Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-orbit-surface border border-orbit-border rounded-xl p-6 flex items-center gap-5"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-100">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-orbit-surface border border-orbit-border rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-5">
            Personal Information
          </h2>

          {profileSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-orbit-surface border border-orbit-border rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-5">
            Change Password
          </h2>

          {passwordSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">

            {/* Current Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Current Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                New Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Confirm New Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Lock className="w-4 h-4" />
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}