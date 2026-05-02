import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, role, loading } = useAuth();

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
