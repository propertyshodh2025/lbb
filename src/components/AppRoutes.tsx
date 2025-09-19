"use client";

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import RoleBasedRedirect from '@/pages/RoleBasedRedirect';
import ProfilePage from '@/pages/ProfilePage';
import AdminDashboard from '@/pages/AdminDashboard';
import ManagerDashboard from '@/pages/ManagerDashboard';
import EditorDashboard from '@/pages/EditorDashboard';
import ClientDashboard from '@/pages/ClientDashboard';
import ProjectDetailsPage from '@/pages/ProjectDetailsPage';
import TaskDetailsPage from '@/pages/TaskDetailsPage';
import UserManagementPage from '@/pages/UserManagementPage';
import TasksPage from '@/pages/TasksPage'; // Import the new TasksPage

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/projects/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ProjectDetailsPage /></ProtectedRoute>} />
        <Route path="/tasks/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'editor']}><TaskDetailsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/editor" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'editor']}><EditorDashboard /></ProtectedRoute>} />
        <Route path="/client" element={<ProtectedRoute allowedRoles={['client', 'admin']}><ClientDashboard /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'editor']}><TasksPage /></ProtectedRoute>} /> {/* New route for TasksPage */}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;