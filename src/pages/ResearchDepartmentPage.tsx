"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FlaskConical } from 'lucide-react'; // Using FlaskConical for R&D
import ProtectedRoute from '@/components/ProtectedRoute';

const ResearchDepartmentPage = () => {
  return (
    <ProtectedRoute allowedRoles={['admin', 'manager']}>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-md text-center bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" asChild className="text-lime-300 hover:text-lime-400">
                <Link to="/admin" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Link>
              </Button>
              <CardTitle className="text-3xl font-bold text-white/90 flex-grow">R&D Department</CardTitle>
              <div className="w-10" /> {/* Spacer */}
            </div>
            <CardDescription className="text-lg text-white/70">
              Innovating for the future.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FlaskConical className="h-24 w-24 text-lime-400 mx-auto" />
            <p className="text-white/70 text-xl">
              This department is under construction. Our scientists are busy at work!
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ResearchDepartmentPage;