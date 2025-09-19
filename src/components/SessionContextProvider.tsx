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
  const [isLoading, setIsLoading] = useState(true); // Start loading

  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthStateChange = async (event: string, currentSession: Session | null) => {
      console.log("Auth state changed:", event, currentSession ? "Session exists" : "No session");
      setIsLoading(true); // Set loading to true at the start of handling any auth state change

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);

        // Fetch profile
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

        // Redirect logic for authenticated users
        if (window.location.pathname === '/login') {
          navigate('/');
        }
      } else {
        // No session (SIGNED_OUT or INITIAL_SESSION with no session)
        setSession(null);
        setUser(null);
        setProfile(null);
        // Redirect logic for unauthenticated users
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
      setIsLoading(false); // Always set loading to false after processing the state change
    };

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Clean up the subscription on component unmount
    return () => subscription.unsubscribe();
  }, [navigate]); // Depend on navigate to ensure it's stable

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