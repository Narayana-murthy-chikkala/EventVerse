import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ adminOnly = false, organizerOrAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (organizerOrAdmin && user.role !== 'admin' && user.role !== 'organizer') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
