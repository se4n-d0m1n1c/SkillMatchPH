import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentManagement from './pages/admin/StudentManagement'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import './App.css'

function App() {
  const { user, role } = useAuth();

  return (
    <div className="app">
      <Routes>
        {/* Public Route */}
        <Route path="/" element={!user ? <AuthPage /> : (
          !role ? <div className="loading-screen" /> : (
            role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
          )
        )} />

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
