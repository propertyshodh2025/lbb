"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Handshake, Swords, Trophy } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DepartmentCard from '@/components/DepartmentCard';

const SalesDepartmentPage = () => {
  return (
    <ProtectedRoute allowedRoles={['admin', 'manager']}>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-6xl text-center bg-neutral-900 rounded-2xl glass-border">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" asChild className="text-lime-300 hover:text-lime-400">
                <Link to="/admin" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Departments
                </Link>
              </Button>
              <CardTitle className="text-3xl font-bold text-white/90 flex-grow">Sales Department</CardTitle>
              <div className="w-10" /> {/* Spacer */}
            </div>
            <CardDescription className="text-lg text-white/70">
              Driving growth and building client relationships.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <TrendingUp className="h-24 w-24 text-lime-400 mx-auto mb-4" />
            <p className="text-white/70 text-xl mb-6">
              Welcome to the Sales Department! Here you can manage your sales team and track progress.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DepartmentCard
                title="Sales Manager Management"
                description="Manage sales managers, assign territories, and oversee team performance."
                icon={Handshake}
                to="/admin/departments/sales-management"
              />
              <DepartmentCard
                title="Sales Warriors"
                description="View and manage individual sales representatives and their pipelines."
                icon={Swords}
                to="/warrior-dashboard" // Placeholder for future page
              />
              <DepartmentCard
                title="Deal Closers"
                description="Track high-value deals and manage the closing process."
                icon={Trophy}
                to="/deal-closer-dashboard" // Placeholder for future page
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default SalesDepartmentPage;