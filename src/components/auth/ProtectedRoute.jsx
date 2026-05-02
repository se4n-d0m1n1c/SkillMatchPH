import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, role, status, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect pending students
  if (role === 'student' && status === 'pending' && window.location.pathname !== '/pending') {
    return <Navigate to="/pending" replace />;
  }

  // Redirect rejected students
  if (role === 'student' && status === 'rejected' && window.location.pathname !== '/rejected') {
    return <Navigate to="/rejected" replace />;
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!adminOnly && role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!role && user) {
    return null; // Wait for role to resolve
  }

  return children;
};

export default ProtectedRoute;
