import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />
  }

  if (user && !user.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}