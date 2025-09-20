"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';

type UserRole = 'admin' | 'manager' | 'editor' | 'sales_manager' | 'warrior' | 'deal_closer' | 'client'; // Keep 'client' for existing data, but remove from new options

interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionContextProviderProps {
  children: React.ReactNode;
  devRole: UserRole | null; // New prop
}

export const SessionContextProvider = ({ children, devRole }: SessionContextProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    console.log("SessionContextProvider useEffect: devRole changed to", devRole);

    const handleSessionAndProfile = async (currentSession: Session | null) => {
      if (!isMounted) return;

      setIsLoading(true);

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, first_name, last_name, avatar_url')
          .eq('id', currentSession.user.id)
          .single();

        if (!isMounted) return;

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          showError("Failed to load user profile.");
          setProfile(null);
        } else {
          setProfile(profileData);
        }

        if (window.location.pathname === '/login') {
          navigate('/');
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') { // Allow '/' for DevHomePage
          navigate('/login');
        }
      }
      if (isMounted) setIsLoading(false);
    };

    const setupDevSession = (role: UserRole) => {
      setIsLoading(false);
      const mockUserId = `dev-user-${role}-id`; // Consistent mock ID
      const mockEmail = `${role}@example.com`;
      const mockFirstName = role.charAt(0).toUpperCase() + role.slice(1);
      const mockLastName = 'User';

      const mockUser: User = {
        id: mockUserId,
        email: mockEmail,
        app_metadata: { provider: 'email' },
        user_metadata: { first_name: mockFirstName, last_name: mockLastName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated', // Supabase auth role
        updated_at: new Date().toISOString(),
      };

      const mockProfile: Profile = {
        id: mockUserId,
        role: role,
        first_name: mockFirstName,
        last_name: mockLastName,
        avatar_url: '',
      };

      const mockSession: Session = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: mockUser,
      };

      setSession(mockSession);
      setUser(mockUser);
      setProfile(mockProfile);
      console.log(`SessionContextProvider: Mock session set for role: ${role}`);
      // After setting mock session, the AppRoutes will re-evaluate and redirect via RoleBasedRedirect
    };

    if (devRole) {
      setupDevSession(devRole);
    } else {
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (isMounted) {
          handleSessionAndProfile(initialSession);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
        console.log("Auth state changed:", event, currentSession ? "Session exists" : "No session");
        if (isMounted) {
          handleSessionAndProfile(currentSession);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }
  }, [navigate, devRole]); // Re-run effect if devRole changes

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