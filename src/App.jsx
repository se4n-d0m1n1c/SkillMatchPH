import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentManagement from './pages/admin/StudentManagement'
import UniversityManagement from './pages/admin/UniversityManagement'
import ProgramManagement from './pages/admin/ProgramManagement'
import PendingPage from './pages/PendingPage'
import RejectedPage from './pages/RejectedPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import StudentLayout from './components/student/StudentLayout'
import StudentProfile from './pages/student/StudentProfile'
import Programs from './pages/student/Programs'
import CareerAssessment from './pages/student/CareerAssessment'
import AdminRegistration from './pages/AdminRegistration'
import AdminInvites from './pages/admin/AdminInvites'
import AssessmentManagement from './pages/admin/AssessmentManagement'
import Reports from './pages/admin/Reports'
import ContactRequests from './pages/admin/ContactRequests'
import AdminProfile from './pages/admin/AdminProfile'
import ThemeToggle from './components/common/ThemeToggle'
import './App.css'

function App() {
  const { user, role, status, loading } = useAuth();

  return (
    <div className="app">
      <ThemeToggle />
      <Routes>
        {/* Public Route */}
        <Route path="/admin/register" element={<AdminRegistration />} />

        <Route path="/" element={!user ? <AuthPage /> : (
          (loading && !role) ? (
            <div className="loading-screen">
              <div className="loader"></div>
            </div>
          ) : (
            role === 'admin' ? <Navigate to="/admin" replace /> : (
              status === 'pending' ? <Navigate to="/pending" replace /> : (
                status === 'rejected' ? <Navigate to="/rejected" replace /> : <Navigate to="/dashboard" replace />
              )
            )
          )
        )} />

        {/* Status Routes */}
        <Route path="/pending" element={
          <ProtectedRoute>
            {role === 'admin' ? <Navigate to="/admin" replace /> : <PendingPage />}
          </ProtectedRoute>
        } />
        
        <Route path="/rejected" element={
          <ProtectedRoute>
            {role === 'admin' ? <Navigate to="/admin" replace /> : <RejectedPage />}
          </ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <StudentLayout>
              <Dashboard />
            </StudentLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/programs" element={
          <ProtectedRoute>
            <StudentLayout>
              <Programs />
            </StudentLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/assessment" element={
          <ProtectedRoute>
            <StudentLayout>
              <CareerAssessment />
            </StudentLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/profile" element={
          <ProtectedRoute>
            <StudentLayout>
              <StudentProfile />
            </StudentLayout>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/students" element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <StudentManagement />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/universities" element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <UniversityManagement />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/programs" element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <ProgramManagement />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/invites" element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <AdminInvites />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/assessments" element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <AssessmentManagement />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/reports" element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <Reports />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/requests" element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <ContactRequests />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/profile" element={
          <ProtectedRoute adminOnly>
            <AdminLayout>
              <AdminProfile />
            </AdminLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
