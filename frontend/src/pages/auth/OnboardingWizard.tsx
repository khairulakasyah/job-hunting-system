import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, Globe, MapPin, DollarSign, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { jobService } from '@/services/jobService'

type Step = 1 | 2 | 3

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([])

  const [targetRole, setTargetRole] = useState('')
  const [preferredPlatform, setPreferredPlatform] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [salaryExpectation, setSalaryExpectation] = useState('')

  useEffect(() => {
    jobService.getPlatforms().then(setAvailablePlatforms).catch(() => {})
  }, [])

  const handleNext = () => {
    if (step === 1 && !targetRole.trim()) { toast.error('Please enter your target role.'); return }
    setStep(p => (p + 1) as Step)
  }

  const handleFinish = async () => {
    if (!user) return
    setLoading(true)
    try {
      const updated = await authService.updateProfile({
        name: user.name,
        email: user.email,
        target_role: targetRole || null,
        preferred_platform: preferredPlatform || null,
        preferred_location: preferredLocation || null,
        salary_expectation: salaryExpectation || null,
        onboarding_completed: true,
      })
      updateUser(updated)
      toast.success('Welcome aboard! Your preferences are saved.')
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Failed to save preferences.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-orbit-primary focus:ring-2 focus:ring-orbit-primary/20 transition-all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-teal-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center shadow-lg shadow-orbit-primary/20">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <span className="text-slate-800 font-bold text-lg">Job Hunter</span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {([1, 2, 3] as Step[]).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s
                  ? 'bg-orbit-primary text-white shadow-md shadow-orbit-primary/30 scale-110'
                  : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 transition-colors ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8"
        >
          {/* Step 1: Target Role */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto">
                <Target className="w-7 h-7 text-orbit-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800">What role are you looking for?</h2>
                <p className="text-slate-500 text-sm mt-1">This helps us personalize your experience</p>
              </div>
              <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                autoFocus className={inputClass} />
              <button onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orbit-primary hover:bg-orbit-primary/90 text-white text-sm font-semibold rounded-xl transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Platform + Location */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto">
                <Globe className="w-7 h-7 text-orbit-accent" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800">Where are you looking?</h2>
                <p className="text-slate-500 text-sm mt-1">Set your preferred platforms and location</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Preferred Platform</label>
                  <input type="text" value={preferredPlatform} onChange={e => setPreferredPlatform(e.target.value)}
                    placeholder="e.g. LinkedIn, Indeed, JobStreet" list="onboard-platform-list"
                    className={inputClass} />
                  <datalist id="onboard-platform-list">
                    {availablePlatforms.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Preferred Location</label>
                  <input type="text" value={preferredLocation} onChange={e => setPreferredLocation(e.target.value)}
                    placeholder="e.g. Kuala Lumpur, Remote" className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors">
                  Back
                </button>
                <button onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-orbit-primary hover:bg-orbit-primary/90 text-white text-sm font-semibold rounded-xl transition-colors">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Salary + Done */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
                <DollarSign className="w-7 h-7 text-amber-600" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800">Almost there!</h2>
                <p className="text-slate-500 text-sm mt-1">Set your salary expectations to get better insights</p>
              </div>
              <input type="text" value={salaryExpectation} onChange={e => setSalaryExpectation(e.target.value)}
                placeholder="e.g. RM 6,000 - RM 8,000" autoFocus className={inputClass} />
              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors">
                  Back
                </button>
                <button onClick={handleFinish} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                  {loading ? 'Saving...' : 'Done!'}
                  {!loading && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Skip link */}
        <div className="text-center mt-6">
          <button onClick={handleFinish} disabled={loading}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Skip onboarding — I'll set up later
          </button>
        </div>
      </motion.div>
    </div>
  )
}
