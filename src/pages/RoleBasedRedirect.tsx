"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';

const RoleBasedRedirect = () => {
  const { profile, isLoading, session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("RoleBasedRedirect useEffect: isLoading", isLoading, "session", !!session, "profile", profile);
    if (!isLoading) {
      if (!session) {
        console.log("RoleBasedRedirect: No session, navigating to /login.");
        navigate('/login');
        return;
      }

      if (!profile) {
        console.error("RoleBasedRedirect: Profile is unexpectedly null after ProtectedRoute. This should not happen.");
        navigate('/complete-profile');
        return;
      }

      switch (profile.role) {
        case 'admin':
          console.log("RoleBasedRedirect: Navigating to /admin.");
          navigate('/admin');
          break;
        case 'manager':
          console.log("RoleBasedRedirect: Navigating to /manager.");
          navigate('/manager');
          break;
        case 'editor':
          console.log("RoleBasedRedirect: Navigating to /editor.");
          navigate('/editor');
          break;
        case 'client':
          console.log("RoleBasedRedirect: Navigating to /client.");
          navigate('/client');
          break;
        default:
          console.warn("RoleBasedRedirect: Unknown role or profile not fully loaded:", profile?.role);
          navigate('/complete-profile');
          break;
      }
    }
  }, [isLoading, profile, session, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
        <div className="w-full max-w-md bg-neutral-900 p-8 rounded-2xl shadow-md text-center glass-border">
          <Skeleton className="h-8 w-3/4 mb-4 mx-auto bg-neutral-700" />
          <Skeleton className="h-4 w-1/2 mx-auto bg-neutral-700" />
          <Skeleton className="h-10 w-full mt-6 bg-neutral-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <p className="text-lg text-white/70">Redirecting to your dashboard...</p>
    </div>
  );
};

export default RoleBasedRedirect;