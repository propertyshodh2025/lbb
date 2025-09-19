"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: { id: string; role: string; first_name: string; last_name: string; avatar_url: string; } | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SessionContextType['profile']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthStateChange = async (event: string, currentSession: Session | null) => {
      console.log("Auth state changed:", event, currentSession ? "Session exists" : "No session");
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, first_name, last_name, avatar_url')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile on auth state change:", profileError);
          showError("Failed to load user profile.");
          setProfile(null); // Profile is null if there's an error
        } else {
          setProfile(profileData);
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (window.location.pathname === '/login') {
            navigate('/'); // Redirect to home if logged in and on login page
          }
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        if (window.location.pathname !== '/login') {
          navigate('/login'); // Only redirect to login if no session and not already on login page
        }
      }
      setIsLoading(false); // Ensure loading is false after any auth state change
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Initial session check
    const checkInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
          showError("Failed to retrieve initial session.");
          setSession(null);
          setUser(null);
          setProfile(null);
          if (window.location.pathname !== '/login') {
            navigate('/login');
          }
        } else if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, first_name, last_name, avatar_url')
            .eq('id', initialSession.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching initial profile:", profileError);
            showError("Failed to load user profile.");
            setProfile(null); // Profile is null if there's an error
          } else {
            setProfile(profileData);
          }
          if (window.location.pathname === '/login') {
            navigate('/');
          }
        } else {
          // No initial session, redirect to login if not already there
          if (window.location.pathname !== '/login') {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error("Unexpected error during initial session check:", error);
        showError("An unexpected error occurred during authentication.");
        setSession(null);
        setUser(null);
        setProfile(null);
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      } finally {
        setIsLoading(false); // ALWAYS set loading to false after initial check
      }
    };

    checkInitialSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, user, profile, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};