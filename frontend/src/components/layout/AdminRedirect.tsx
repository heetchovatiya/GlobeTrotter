import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/** Redirect logged-in admins away from public traveler pages. */
export const AdminRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, user } = useAuthStore();

  if (isAuthenticated && (isAdmin || user?.role === 'admin')) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
