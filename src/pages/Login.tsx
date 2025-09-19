"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useEffect, useRef } from 'react'; // Import useRef
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false); // To prevent multiple navigations

  useEffect(() => {
    if (!isLoading && session && !isNavigatingRef.current) {
      isNavigatingRef.current = true; // Set flag
      navigate('/'); // Redirect to home if already logged in
    }
  }, [session, isLoading, navigate]);

  if (isLoading || session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">Welcome Back!</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Only email/password for now
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            }}
          }
          theme="light" // Use light theme, can be dynamic later
          redirectTo={window.location.origin + '/'}
        />
      </div>
    </div>
  );
};

export default Login;