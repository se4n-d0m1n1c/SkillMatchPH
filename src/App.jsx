import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentManagement from './pages/admin/StudentManagement'
import PendingPage from './pages/PendingPage'
import RejectedPage from './pages/RejectedPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import './App.css'

function App() {
  const { user, role, status } = useAuth();

  return (
    <div className="app">
      <Routes>
        {/* Public Route */}
        <Route path="/" element={!user ? <AuthPage /> : (
          !role ? <div className="loading-screen" /> : (
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
            <PendingPage />
          </ProtectedRoute>
        } />
        
        <Route path="/rejected" element={
          <ProtectedRoute>
            <RejectedPage />
          </ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
