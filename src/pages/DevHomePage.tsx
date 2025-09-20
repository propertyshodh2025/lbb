"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface DevHomePageProps {
  onSelectRole: (role: 'admin' | 'manager' | 'editor' | 'client') => void;
}

const DevHomePage = ({ onSelectRole }: DevHomePageProps) => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'admin' | 'manager' | 'editor' | 'client') => {
    onSelectRole(role);
    // Navigate to the appropriate dashboard after setting the role
    switch (role) {
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
        navigate('/');
    }
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