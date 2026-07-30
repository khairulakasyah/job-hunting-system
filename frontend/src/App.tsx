import { Toaster } from 'sonner'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from './routes/ProtectedRoute'

import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { JobOfferComparePage } from '@/pages/jobs/JobOfferComparePage'
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { JobsPage } from '@/pages/jobs/JobsPage'
import { KanbanPage } from '@/pages/jobs/KanbanPage'
import { CalendarPage } from '@/pages/jobs/CalendarPage'
import { EmailTemplatesPage } from '@/pages/jobs/EmailTemplatesPage'
import { NotesKanbanPage } from '@/pages/notes/NotesKanbanPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { OnboardingWizard } from '@/pages/auth/OnboardingWizard'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { useAuth } from '@/contexts/AuthContext'

export default function App() {
  const { isAdmin } = useAuth()
  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            background: '#1E293B',
            border: '1px solid #334155',
            color: '#E2E8F0',
            fontSize: '14px',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
      {/* Public routes */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />

      {/* Protected routes � must be logged in */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/offers" element={<JobOfferComparePage />} />
        <Route path="/jobs/pipeline" element={<KanbanPage />} />
        <Route path="/jobs/calendar" element={<CalendarPage />} />
        <Route path="/jobs/email-templates" element={<EmailTemplatesPage />} />
        <Route path="/notes" element={<NotesKanbanPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {isAdmin && <Route path="/admin/dashboard" element={<AdminDashboardPage />} />}
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  )
}
