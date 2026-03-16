import { Navigate } from 'react-router-dom';
import { getAuthToken, getUserRole } from '../utils/auth';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const token = getAuthToken();
  const userRole = getUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
