"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileForm from '@/components/ProfileForm';

const ProfilePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-400">Manage your personal information.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;