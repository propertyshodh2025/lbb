"use client";

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import TasksPage from '@/pages/TasksPage';
import ProjectsPage from '@/pages/ProjectsPage';
import CompleteProfilePage from '@/pages/CompleteProfilePage';

// Define routes with their allowed roles
const routesConfig = [
  { path: "/", element: <RoleBasedRedirect />, allowedRoles: ['admin', 'manager', 'editor', 'client'] },
  { path: "/profile", element: <ProfilePage />, allowedRoles: ['admin', 'manager', 'editor', 'client'] },
  { path: "/complete-profile", element: <CompleteProfilePage />, allowedRoles: ['admin', 'manager', 'editor', 'client'] }, // Accessible to all authenticated users
  { path: "/projects/:id", element: <ProjectDetailsPage />, allowedRoles: ['admin', 'manager'] },
  { path: "/tasks/:id", element: <TaskDetailsPage />, allowedRoles: ['admin', 'manager', 'editor'] },
  { path: "/admin", element: <AdminDashboard />, allowedRoles: ['admin'] },
  { path: "/manager", element: <ManagerDashboard />, allowedRoles: ['admin', 'manager'] },
  { path: "/editor", element: <EditorDashboard />, allowedRoles: ['admin', 'manager', 'editor'] },
  { path: "/client", element: <ClientDashboard />, allowedRoles: ['client', 'admin'] },
  { path: "/users", element: <UserManagementPage />, allowedRoles: ['admin'] },
  { path: "/tasks", element: <TasksPage />, allowedRoles: ['admin', 'manager', 'editor'] },
  { path: "/projects", element: <ProjectsPage />, allowedRoles: ['admin', 'manager'] },
];

const AppRoutes = () => {
  const location = useLocation();
  console.log("AppRoutes rendered, current path:", location.pathname);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {routesConfig.map((route, index) => (
        <Route
          key={index}
          path={route.path}
          element={<ProtectedRoute allowedRoles={route.allowedRoles}>{route.element}</ProtectedRoute>}
        />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;