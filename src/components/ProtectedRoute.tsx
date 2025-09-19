"use client";

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from './SessionContextProvider';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { session, profile, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading authentication...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // User is logged in but doesn't have the required role
    // You might want to show an "Access Denied" page or redirect to a general dashboard
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-600 dark:text-red-400">Access Denied</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">You do not have permission to view this page.</p>
          <Navigate to="/" replace /> {/* Redirect to home or a suitable page */}
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;