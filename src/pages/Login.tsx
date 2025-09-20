"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (!isLoading && session && !isNavigatingRef.current) {
      isNavigatingRef.current = true;
      navigate('/');
    }
  }, [session, isLoading, navigate]);

  if (isLoading || session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <p className="text-lg text-white/70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md bg-neutral-900 p-8 rounded-2xl shadow-lg glass-border">
        <h2 className="text-2xl font-bold text-center mb-6 text-white/90">Welcome Back!</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--lime-400))', // Using lime-400 for brand color
                  brandAccent: 'hsl(var(--lime-300))', // Using lime-300 for brand accent
                  inputText: 'hsl(var(--foreground))',
                  inputBackground: 'hsl(var(--neutral-800))',
                  inputBorder: 'hsl(var(--neutral-700))',
                  inputBorderHover: 'hsl(var(--lime-400))',
                  inputBorderFocus: 'hsl(var(--lime-400))',
                  inputLabel: 'hsl(var(--white/70))',
                  messageText: 'hsl(var(--foreground))',
                  messageBackground: 'hsl(var(--neutral-800))',
                  anchorText: 'hsl(var(--lime-300))',
                  anchorTextHover: 'hsl(var(--lime-400))',
                  buttonBackground: 'hsl(var(--lime-400))',
                  buttonBackgroundHover: 'hsl(var(--lime-300))',
                  buttonBorder: 'hsl(var(--lime-400))',
                  buttonText: 'hsl(var(--black))',
                },
              },
            }}
          }
          theme="dark" // Force dark theme for auth UI
          redirectTo={window.location.origin + '/'}
        />
      </div>
    </div>
  );
};

export default Login;