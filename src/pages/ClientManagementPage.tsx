"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UserManagementList from '@/components/UserManagementList';
import AddUserForm from '@/components/AddUserForm';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Link } from 'react-router-dom';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ClientManagementPage = () => {
  const [userListRefreshTrigger, setUserListRefreshTrigger] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);

  const handleUserAdded = () => {
    setUserListRefreshTrigger(!userListRefreshTrigger);
    setIsAddClientDialogOpen(false); // Close dialog after adding user
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'manager']}>
      <div className="flex flex-col items-center min-h-screen p-4 bg-neutral-950">
        <Card className="w-full max-w-4xl shadow-lg mt-8 mb-8 bg-neutral-900 rounded-2xl glass-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" asChild className="text-lime-300 hover:text-lime-400">
                <Link to="/admin/departments/media" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Media Dept.
                </Link>
              </Button>
              <CardTitle className="text-3xl font-bold text-white/90 text-center flex-grow">
                Client Management
              </CardTitle>
              <div className="w-10" /> {/* Spacer */}
            </div>
            <CardDescription className="text-lg text-white/70 text-center">
              Manage client profiles and add new clients for media production services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-end mb-4">
              <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800 z-50">
                  <DialogHeader>
                    <DialogTitle className="text-white/90">Add New Client</DialogTitle>
                    <DialogDescription className="text-white/70">
                      Fill in the details to create a new client profile.
                    </DialogDescription>
                  </DialogHeader>
                  <AddUserForm onUserAdded={handleUserAdded} defaultRole="client" hideRoleSelection={true} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900 glass-border">
              <h3 className="text-xl font-semibold mb-4 text-white/90">Existing Clients</h3>
              <UserManagementList refreshTrigger={userListRefreshTrigger} filterByRole="client" hideFilters={true} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ClientManagementPage;