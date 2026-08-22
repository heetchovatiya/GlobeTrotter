import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isAdmin, user } = useAuthStore();
  const { showToast } = useUIStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && user?.role !== 'admin') {
    showToast('error', 'Access denied. Administrator privileges required.');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

