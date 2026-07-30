import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Save, Lock, Eye, EyeOff,
  Briefcase, Send, CalendarCheck, Award, FileText, StickyNote,
  Globe, ExternalLink, Linkedin, Github, MapPin, DollarSign, Target
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { jobService, JobStats } from '@/services/jobService'
import { emailTemplateService } from '@/services/emailTemplateService'
import { generalNoteService, NoteCategory } from '@/services/generalNoteService'

interface FormState {
  loading: boolean
  error: string
  success: string
}

const emptyFormState: FormState = { loading: false, error: '', success: '' }

export function ProfilePage() {
  const { user, updateUser } = useAuth()

  // Stats
  const [stats, setStats] = useState<{ jobs: JobStats | null; templates: number; notes: number }>({
    jobs: null, templates: 0, notes: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [jobStats, templates, board] = await Promise.all([
          jobService.getStats(),
          emailTemplateService.getAll(),
          generalNoteService.getBoard(),
        ])
        const notesCount = board.reduce((sum: number, cat: NoteCategory) => sum + cat.notes.length, 0)
        setStats({ jobs: jobStats, templates: templates.length, notes: notesCount })
      } catch { /* stats are non-critical */ }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    jobService.getPlatforms().then(setAvailablePlatforms).catch(() => {})
  }, [])

  // Personal Info
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [infoState, setInfoState] = useState<FormState>(emptyFormState)

  // Links
  const [resumeUrl, setResumeUrl] = useState(user?.resume_url ?? '')
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url ?? '')
  const [githubUrl, setGithubUrl] = useState(user?.github_url ?? '')
  const [linksState, setLinksState] = useState<FormState>(emptyFormState)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordState, setPasswordState] = useState<FormState>(emptyFormState)

  // Preferences
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([])
  const [preferredPlatform, setPreferredPlatform] = useState(user?.preferred_platform ?? '')
  const [preferredLocation, setPreferredLocation] = useState(user?.preferred_location ?? '')
  const [salaryExpectation, setSalaryExpectation] = useState(user?.salary_expectation ?? '')
  const [targetRole, setTargetRole] = useState(user?.target_role ?? '')
  const [prefsState, setPrefsState] = useState<FormState>(emptyFormState)

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfoState({ ...emptyFormState, loading: true })
    try {
      const updatedUser = await authService.updateProfile({ name, email })
      updateUser(updatedUser)
      setInfoState({ ...emptyFormState, success: 'Profile updated successfully.' })
    } catch {
      setInfoState({ ...emptyFormState, error: err.response?.data?.message || 'Failed to update profile.' })
    }
  }

  const handleLinksSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLinksState({ ...emptyFormState, loading: true })
    try {
      const updatedUser = await authService.updateProfile({
        name, email, resume_url: resumeUrl || null, portfolio_url: portfolioUrl || null,
        linkedin_url: linkedinUrl || null, github_url: githubUrl || null,
      })
      updateUser(updatedUser)
      setLinksState({ ...emptyFormState, success: 'Links saved successfully.' })
    } catch {
      setLinksState({ ...emptyFormState, error: err.response?.data?.message || 'Failed to save links.' })
    }
  }

  const handlePrefsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPrefsState({ ...emptyFormState, loading: true })
    try {
      const updatedUser = await authService.updateProfile({
        name, email, preferred_platform: preferredPlatform || null,
        preferred_location: preferredLocation || null,
        salary_expectation: salaryExpectation || null, target_role: targetRole || null,
      })
      updateUser(updatedUser)
      setPrefsState({ ...emptyFormState, success: 'Preferences saved successfully.' })
    } catch {
      setPrefsState({ ...emptyFormState, error: err.response?.data?.message || 'Failed to save preferences.' })
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordState({ ...emptyFormState, loading: true })
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      })
      setPasswordState({ ...emptyFormState, success: 'Password changed successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordState({ ...emptyFormState, error: err.response?.data?.message || 'Failed to change password.' })
    }
  }

  const statCards = [
    { label: 'Jobs Tracked', value: stats.jobs?.total ?? '-', icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
    { label: 'Applications', value: stats.jobs?.applied ?? '-', icon: Send, color: 'from-violet-500 to-purple-500' },
    { label: 'Interviews', value: stats.jobs?.interview ?? '-', icon: CalendarCheck, color: 'from-amber-500 to-orange-500' },
    { label: 'Offers', value: stats.jobs?.offer ?? '-', icon: Award, color: 'from-emerald-500 to-teal-500' },
    { label: 'Templates', value: stats.templates, icon: FileText, color: 'from-pink-500 to-rose-500' },
    { label: 'Notes', value: stats.notes, icon: StickyNote, color: 'from-indigo-500 to-blue-500' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
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

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="bg-orbit-surface border border-orbit-border rounded-xl p-4 flex flex-col items-center gap-2"
          >
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-100">{card.value}</span>
            <span className="text-xs text-slate-500 text-center">{card.label}</span>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-orbit-surface border border-orbit-border rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-5">Personal Information</h2>

          {infoState.success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{infoState.success}</div>
          )}
          {infoState.error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{infoState.error}</div>
          )}

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name <span className="text-red-400">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your full name"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address <span className="text-red-400">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="your@email.com"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={infoState.loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              {infoState.loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* Resume & Portfolio Links */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-orbit-surface border border-orbit-border rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-5">Resume & Portfolio Links</h2>

          {linksState.success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{linksState.success}</div>
          )}
          {linksState.error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{linksState.error}</div>
          )}

          <form onSubmit={handleLinksSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Resume / CV URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="url" value={resumeUrl} onChange={e => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-resume"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Portfolio URL</label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://your-portfolio.com"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">LinkedIn Profile</label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">GitHub Profile</label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/your-profile"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={linksState.loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              {linksState.loading ? 'Saving...' : 'Save Links'}
            </button>
          </form>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-orbit-surface border border-orbit-border rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-5">Change Password</h2>

          {passwordState.success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{passwordState.success}</div>
          )}
          {passwordState.error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{passwordState.error}</div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} required placeholder="Enter current password"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type={showNew ? 'text' : 'password'} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} required placeholder="Min. 8 characters"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm New Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat new password"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={passwordState.loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              <Lock className="w-4 h-4" />
              {passwordState.loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </motion.div>

        {/* Job Search Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-orbit-surface border border-orbit-border rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-5">Job Search Preferences</h2>

          {prefsState.success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{prefsState.success}</div>
          )}
          {prefsState.error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{prefsState.error}</div>
          )}

          <form onSubmit={handlePrefsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Preferred Platform</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="text" value={preferredPlatform} onChange={e => setPreferredPlatform(e.target.value)}
                  placeholder="e.g. LinkedIn, Indeed, JobStreet" list="pref-platform-list"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
                <datalist id="pref-platform-list">
                  {availablePlatforms.map(p => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Role / Title</label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Preferred Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="text" value={preferredLocation} onChange={e => setPreferredLocation(e.target.value)}
                  placeholder="e.g. Kuala Lumpur, Remote"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Salary Expectation</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="text" value={salaryExpectation} onChange={e => setSalaryExpectation(e.target.value)}
                  placeholder="e.g. RM 6,000 - RM 8,000"
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-orbit-primary transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={prefsState.loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orbit-primary hover:bg-orbit-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              {prefsState.loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  )
}
