import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Verifying Academic Session..." />;
  }

  if (!isAuthenticated) {
    // Redirect to /login preserving the requested page location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
