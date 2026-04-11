import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role hierarchy check
  if (requiredRole) {
    const roleHierarchy = {
      'super_admin': 4,
      'owner': 3,
      'franchise': 2,
      'distributor': 1
    };
    
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    const userLevel = roleHierarchy[user.role] || 0;
    
    // super_admin can access everything
    // Other roles must meet or exceed required level
    if (user.role !== 'super_admin' && userLevel < requiredLevel) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
