import { Navigate } from 'react-router-dom';
import { getAuthToken } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  if (!getAuthToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
