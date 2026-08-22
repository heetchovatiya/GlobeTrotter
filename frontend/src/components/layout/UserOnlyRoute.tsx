import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/** Blocks admin users from traveler-only routes. */
export const UserOnlyRoute: React.FC = () => {
  const { isAdmin, user } = useAuthStore();

  if (isAdmin || user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};
