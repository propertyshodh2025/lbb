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
import SalesManagerManagementPage from '@/pages/SalesManagerManagementPage'; // Renamed Client Management Page
import SalesManagerDashboard from '@/pages/SalesManagerDashboard'; // New Sales Manager Dashboard
import WarriorDashboard from '@/pages/WarriorDashboard'; // New Warrior Dashboard
import DealCloserDashboard from '@/pages/DealCloserDashboard'; // New Deal Closer Dashboard
import { useSession } from '@/components/SessionContextProvider';

// Define roles for type safety
type UserRole = 'admin' | 'manager' | 'editor' | 'sales_manager' | 'warrior' | 'deal_closer' | 'client';

// Define routes with their allowed roles
const routesConfig = [
  { path: "/profile", element: <ProfilePage />, allowedRoles: ['admin', 'manager', 'editor', 'sales_manager', 'warrior', 'deal_closer', 'client'] as UserRole[] },
  { path: "/complete-profile", element: <CompleteProfilePage />, allowedRoles: ['admin', 'manager', 'editor', 'sales_manager', 'warrior', 'deal_closer', 'client'] as UserRole[] },
  { path: "/projects/:id", element: <ProjectDetailsPage />, allowedRoles: ['admin', 'manager'] as UserRole[] },
  { path: "/tasks/:id", element: <TaskDetailsPage />, allowedRoles: ['admin', 'manager', 'editor'] as UserRole[] },
  { path: "/admin", element: <AdminDashboard />, allowedRoles: ['admin'] as UserRole[] }, // New Admin Dashboard (Office View)
  { path: "/admin/overview", element: <AdminOverviewPage />, allowedRoles: ['admin'] as UserRole[] }, // Old Admin Dashboard content
  { path: "/admin/departments/media", element: <MediaDepartmentPage />, allowedRoles: ['admin', 'manager'] as UserRole[] }, // Media Department Page
  { path: "/admin/departments/tech", element: <TechDepartmentPage />, allowedRoles: ['admin', 'manager'] as UserRole[] }, // Tech Department Page
  { path: "/admin/departments/finance", element: <FinanceDepartmentPage />, allowedRoles: ['admin', 'manager'] as UserRole[] }, // Finance Department Page
  { path: "/admin/departments/legal", element: <LegalDepartmentPage />, allowedRoles: ['admin', 'manager'] as UserRole[] }, // Legal Department Page
  { path: "/admin/departments/sales", element: <SalesDepartmentPage />, allowedRoles: ['admin', 'manager'] as UserRole[] }, // Sales Department Page
  { path: "/admin/departments/marketing", element: <MarketingDepartmentPage />, allowedRoles: ['admin', 'manager'] as UserRole[] }, // Marketing Department Page
  { path: "/admin/departments/research", element: <ResearchDepartmentPage />, allowedRoles: ['admin', 'manager'] as UserRole[] }, // Research & Development Department Page
  { path: "/admin/departments/sales-management", element: <SalesManagerManagementPage />, allowedRoles: ['admin', 'manager'] as UserRole[] }, // New Sales Manager Management Page
  { path: "/manager", element: <ManagerDashboard />, allowedRoles: ['admin', 'manager'] as UserRole[] },
  { path: "/editor", element: <EditorDashboard />, allowedRoles: ['admin', 'manager', 'editor'] as UserRole[] },
  { path: "/sales-manager-dashboard", element: <SalesManagerDashboard />, allowedRoles: ['admin', 'sales_manager'] as UserRole[] }, // New Sales Manager Dashboard
  { path: "/warrior-dashboard", element: <WarriorDashboard />, allowedRoles: ['admin', 'warrior'] as UserRole[] }, // New Warrior Dashboard
  { path: "/deal-closer-dashboard", element: <DealCloserDashboard />, allowedRoles: ['admin', 'deal_closer'] as UserRole[] }, // New Deal Closer Dashboard
  { path: "/client", element: <ClientDashboard />, allowedRoles: ['client', 'admin'] as UserRole[] }, // Kept 'client' for existing data
  { path: "/users", element: <UserManagementPage />, allowedRoles: ['admin'] as UserRole[] },
  { path: "/tasks", element: <TasksPage />, allowedRoles: ['admin', 'manager', 'editor'] as UserRole[] },
  { path: "/projects", element: <ProjectsPage />, allowedRoles: ['admin', 'manager'] as UserRole[] },
];

interface AppRoutesProps {
  onSelectDevRole: (role: UserRole) => void;
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
        <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'editor', 'sales_manager', 'warrior', 'deal_closer', 'client']}><RoleBasedRedirect /></ProtectedRoute>} />
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