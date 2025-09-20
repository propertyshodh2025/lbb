"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      showError("Failed to log out.");
    } else {
      showSuccess("You have been logged out successfully.");
      navigate('/login');
    }
  };

  return (
    <Button onClick={handleLogout} variant="destructive" className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
      Logout
    </Button>
  );
};

export default LogoutButton;