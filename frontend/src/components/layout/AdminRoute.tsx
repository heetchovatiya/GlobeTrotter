import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isAdmin, user, isLoading } = useAuthStore();
  const { showToast } = useUIStore();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin && user?.role !== 'admin') {
    showToast('error', 'Access denied. Administrator privileges required.');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

