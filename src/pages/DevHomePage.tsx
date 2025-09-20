"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// Removed useNavigate as direct navigation will be handled by SessionContextProvider and RoleBasedRedirect

interface DevHomePageProps {
  onSelectRole: (role: 'admin' | 'manager' | 'editor' | 'client') => void;
}

const DevHomePage = ({ onSelectRole }: DevHomePageProps) => {
  const handleRoleSelect = (role: 'admin' | 'manager' | 'editor' | 'client') => {
    console.log(`DevHomePage: Selected role: ${role}`);
    onSelectRole(role);
    // Removed explicit navigate calls.
    // The SessionContextProvider's useEffect will detect the new session
    // and RoleBasedRedirect will handle the final navigation based on the profile.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-md shadow-lg bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">Dev Mode: Select Role</CardTitle>
          <CardDescription className="text-lg text-white/70">
            Quickly access dashboards for development.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300" onClick={() => handleRoleSelect('admin')}>
            Login as Admin
          </Button>
          <Button className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300" onClick={() => handleRoleSelect('manager')}>
            Login as Manager
          </Button>
          <Button className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300" onClick={() => handleRoleSelect('editor')}>
            Login as Editor
          </Button>
          <Button className="w-full rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300" onClick={() => handleRoleSelect('client')}>
            Login as Client
          </Button>
          <div className="pt-4 text-center">
            <p className="text-sm text-white/70">
              Or <a href="/login" className="text-lime-300 hover:underline">use actual login</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevHomePage;