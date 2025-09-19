"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { Skeleton } from '@/components/ui/skeleton';

const RoleBasedRedirect = () => {
  const { profile, isLoading, session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        navigate('/login');
        return;
      }

      if (profile) {
        switch (profile.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'manager':
            navigate('/manager');
            break;
          case 'editor':
            navigate('/editor');
            break;
          case 'client':
            navigate('/client');
            break;
          default:
            // Fallback for unknown roles or if profile is still loading
            console.warn("Unknown role or profile not fully loaded:", profile?.role);
            navigate('/login'); // Redirect to login if role is not recognized
            break;
        }
      } else {
        // If session exists but profile is null (e.g., profile not yet created or error fetching)
        console.warn("Session exists but profile is null. Redirecting to login.");
        navigate('/login');
      }
    }
  }, [isLoading, profile, session, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <Skeleton className="h-8 w-3/4 mb-4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-10 w-full mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <p className="text-lg text-gray-700 dark:text-gray-300">Redirecting to your dashboard...</p>
    </div>
  );
};

export default RoleBasedRedirect;