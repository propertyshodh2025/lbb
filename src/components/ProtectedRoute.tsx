"use client";

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from './SessionContextProvider';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'manager' | 'editor' | 'sales_manager' | 'warrior' | 'deal_closer' | 'client')[];
  children: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { session, profile, isLoading } = useSession();
  const location = useLocation();

  console.log("ProtectedRoute - Path:", location.pathname, "isLoading:", isLoading, "session:", !!session, "profile:", !!profile, "profile role:", profile?.role, "allowedRoles:", allowedRoles);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <p className="text-lg text-white/70">Loading authentication...</p>
      </div>
    );
  }

  if (!session) {
    console.log("ProtectedRoute: No session, navigating to /login.");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!profile) {
    console.log("ProtectedRoute: Profile is null, navigating to /complete-profile.");
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    console.log("ProtectedRoute: Access Denied for role", profile.role, "on path", location.pathname);
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-destructive-foreground">Access Denied</h1>
          <p className="text-xl text-white/70 mb-4">You do not have permission to view this page.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;