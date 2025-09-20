"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileForm from '@/components/ProfileForm';

const ProfilePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
      <Card className="w-full max-w-md shadow-lg bg-neutral-900 rounded-2xl glass-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white/90">My Profile</CardTitle>
          <p className="text-lg text-white/70">Manage your personal information.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;