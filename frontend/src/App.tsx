// import { Routes, Route, Navigate } from 'react-router-dom'
// import { Layout } from '@/components/layout/Layout'
// import { DashboardPage } from '@/pages/dashboard/DashboardPage'
// import { BillingPage } from '@/pages/billing/BillingPage'
// import { ContactsPage } from '@/pages/crm/ContactsPage'
// import { ChatPage } from '@/pages/ai/ChatPage'
// import { SettingsPage } from '@/pages/settings/SettingsPage'
// import { HelpPage } from '@/pages/help/HelpPage'
// import { SignInPage } from '@/pages/auth/SignInPage'
// import { SignUpPage } from '@/pages/auth/SignUpPage'
// import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
// import { ComponentsPage } from '@/pages/components/ComponentsPage'

// export default function App() {
//   return (
//     <Routes>
//       {/* Auth routes — no sidebar layout */}
//       <Route path="/sign-in" element={<SignInPage />} />
//       <Route path="/sign-up" element={<SignUpPage />} />
//       <Route path="/forgot-password" element={<ForgotPasswordPage />} />

//       {/* Main app routes — with sidebar layout */}
//       <Route element={<Layout />}>
//         <Route path="/" element={<Navigate to="/dashboard" replace />} />
//         <Route path="/dashboard" element={<DashboardPage />} />
//         <Route path="/billing" element={<BillingPage />} />
//         <Route path="/crm/contacts" element={<ContactsPage />} />
//         <Route path="/ai/chat" element={<ChatPage />} />
//         <Route path="/settings" element={<SettingsPage />} />
//         <Route path="/help" element={<HelpPage />} />
//         <Route path="/components" element={<ComponentsPage />} />
//       </Route>
//     </Routes>
//   )
// }

import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from './routes/ProtectedRoute'

import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { BillingPage } from '@/pages/billing/BillingPage'
import { ContactsPage } from '@/pages/crm/ContactsPage'
import { ChatPage } from '@/pages/ai/ChatPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { HelpPage } from '@/pages/help/HelpPage'
import { ComponentsPage } from '@/pages/components/ComponentsPage'
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { JobsPage } from '@/pages/jobs/JobsPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
// import { CreateJobPage } from '@/pages/jobs/CreateJobPage'
// import { EditJobPage }   from '@/pages/jobs/EditJobPage'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes — must be logged in */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/crm/contacts" element={<ContactsPage />} />
        <Route path="/ai/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/components" element={<ComponentsPage />} />
        <Route path="/jobs"              element={<JobsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* <Route path="/jobs/create"       element={<CreateJobPage />} />
        <Route path="/jobs/:id/edit"     element={<EditJobPage />} /> */}
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}