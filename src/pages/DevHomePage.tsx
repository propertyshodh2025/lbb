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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg dark:bg-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Dev Mode: Select Role</CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
            Quickly access dashboards for development.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => handleRoleSelect('admin')}>
            Login as Admin
          </Button>
          <Button className="w-full" onClick={() => handleRoleSelect('manager')}>
            Login as Manager
          </Button>
          <Button className="w-full" onClick={() => handleRoleSelect('editor')}>
            Login as Editor
          </Button>
          <Button className="w-full" onClick={() => handleRoleSelect('client')}>
            Login as Client
          </Button>
          <div className="pt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Or <a href="/login" className="text-blue-500 hover:underline">use actual login</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevHomePage;