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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, first_name, last_name, avatar_url')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          showError("Failed to load user profile.");
          setProfile(null);
        } else {
          setProfile(profileData);
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Redirect authenticated users from login page
          if (window.location.pathname === '/login') {
            navigate('/');
          }
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        // Redirect unauthenticated users to login page
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
      setIsLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        supabase
          .from('profiles')
          .select('id, role, first_name, last_name, avatar_url')
          .eq('id', initialSession.user.id)
          .single()
          .then(({ data: profileData, error: profileError }) => {
            if (profileError) {
              console.error("Error fetching initial profile:", profileError);
              showError("Failed to load user profile.");
              setProfile(null);
            } else {
              setProfile(profileData);
            }
          });
      }
      setIsLoading(false);
    });

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