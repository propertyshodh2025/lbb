"use client";

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import RoleBasedRedirect from '@/pages/RoleBasedRedirect';
import ProfilePage from '@/pages/ProfilePage';
import AdminDashboard from '@/pages/AdminDashboard'; // New Admin Dashboard (Office View)
import AdminOverviewPage from '@/pages/AdminOverviewPage'; // Old Admin Dashboard content
import ManagerDashboard from '@/pages/ManagerDashboard';
import EditorDashboard from '@/pages/EditorDashboard';
import ClientDashboard from '@/pages/ClientDashboard';
import ProjectDetailsPage from '@/pages/ProjectDetailsPage';
import TaskDetailsPage from '@/pages/TaskDetailsPage';
import UserManagementPage from '@/pages/UserManagementPage';
import TasksPage from '@/pages/TasksPage';
import ProjectsPage from '@/pages/ProjectsPage';
import CompleteProfilePage from '@/pages/CompleteProfilePage';
import DevHomePage from '@/pages/DevHomePage';
import MediaDepartmentPage from '@/pages/MediaDepartmentPage'; // New Media Department Page
import TechDepartmentPage from '@/pages/TechDepartmentPage'; // New Tech Department Page
import FinanceDepartmentPage from '@/pages/FinanceDepartmentPage'; // New Finance Department Page
import LegalDepartmentPage from '@/pages/LegalDepartmentPage'; // New Legal Department Page
import SalesDepartmentPage from '@/pages/SalesDepartmentPage'; // New Sales Department Page
import MarketingDepartmentPage from '@/pages/MarketingDepartmentPage'; // New Marketing Department Page
import ResearchDepartmentPage from '@/pages/ResearchDepartmentPage'; // New Research & Development Department Page
import MediaClientManagementPage from '@/pages/MediaClientManagementPage'; // Renamed Client Management Page
import { useSession } from '@/components/SessionContextProvider';

// Define routes with their allowed roles
const routesConfig = [
  { path: "/profile", element: <ProfilePage />, allowedRoles: ['admin', 'manager', 'editor', 'client', 'media_client'] },
  { path: "/complete-profile", element: <CompleteProfilePage />, allowedRoles: ['admin', 'manager', 'editor', 'client', 'media_client'] },
  { path: "/projects/:id", element: <ProjectDetailsPage />, allowedRoles: ['admin', 'manager'] },
  { path: "/tasks/:id", element: <TaskDetailsPage />, allowedRoles: ['admin', 'manager', 'editor'] },
  { path: "/admin", element: <AdminDashboard />, allowedRoles: ['admin'] }, // New Admin Dashboard (Office View)
  { path: "/admin/overview", element: <AdminOverviewPage />, allowedRoles: ['admin'] }, // Old Admin Dashboard content
  { path: "/admin/departments/media", element: <MediaDepartmentPage />, allowedRoles: ['admin', 'manager'] }, // Media Department Page
  { path: "/admin/departments/tech", element: <TechDepartmentPage />, allowedRoles: ['admin', 'manager'] }, // Tech Department Page
  { path: "/admin/departments/finance", element: <FinanceDepartmentPage />, allowedRoles: ['admin', 'manager'] }, // Finance Department Page
  { path: "/admin/departments/legal", element: <LegalDepartmentPage />, allowedRoles: ['admin', 'manager'] }, // Legal Department Page
  { path: "/admin/departments/sales", element: <SalesDepartmentPage />, allowedRoles: ['admin', 'manager'] }, // Sales Department Page
  { path: "/admin/departments/marketing", element: <MarketingDepartmentPage />, allowedRoles: ['admin', 'manager'] }, // Marketing Department Page
  { path: "/admin/departments/research", element: <ResearchDepartmentPage />, allowedRoles: ['admin', 'manager'] }, // Research & Development Department Page
  { path: "/admin/departments/media/clients", element: <MediaClientManagementPage />, allowedRoles: ['admin', 'manager'] }, // New Media Client Management Page
  { path: "/manager", element: <ManagerDashboard />, allowedRoles: ['admin', 'manager'] },
  { path: "/editor", element: <EditorDashboard />, allowedRoles: ['admin', 'manager', 'editor'] },
  { path: "/client", element: <ClientDashboard />, allowedRoles: ['client', 'admin'] },
  { path: "/users", element: <UserManagementPage />, allowedRoles: ['admin'] },
  { path: "/tasks", element: <TasksPage />, allowedRoles: ['admin', 'manager', 'editor'] },
  { path: "/projects", element: <ProjectsPage />, allowedRoles: ['admin', 'manager'] },
];

interface AppRoutesProps {
  onSelectDevRole: (role: 'admin' | 'manager' | 'editor' | 'client' | 'media_client') => void;
}

const AppRoutes = ({ onSelectDevRole }: AppRoutesProps) => {
  const location = useLocation();
  const { session, isLoading, profile } = useSession();
  console.log("AppRoutes rendered, current path:", location.pathname);

  const showDevHomePage = !isLoading && !session && location.pathname === '/';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {showDevHomePage ? (
        <Route path="/" element={<DevHomePage onSelectRole={onSelectDevRole} />} />
      ) : (
        <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'editor', 'client', 'media_client']}><RoleBasedRedirect /></ProtectedRoute>} />
      )}
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