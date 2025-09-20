"use client";

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, LayoutDashboard, Users, FolderKanban, FileText, UserCircle, ChevronLeft, ChevronRight, ListChecks, Briefcase, Building2, FlaskConical, Code, DollarSign, Scale, TrendingUp, Megaphone, UserRound } from 'lucide-react'; // Import Building2 for departments and FlaskConical
import UserNav from './UserNav';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'editor'] }, // Removed 'client' role
  { to: '/admin', label: 'Departments', icon: Building2, roles: ['admin'] }, // New Admin Dashboard (Office View)
  { to: '/admin/overview', label: 'Admin Overview', icon: LayoutDashboard, roles: ['admin'] }, // Old Admin Dashboard content
  { to: '/admin/departments/media', label: 'Media Production', icon: Briefcase, roles: ['admin', 'manager'] },
  { to: '/admin/departments/media/clients', label: 'Media Clients', icon: UserRound, roles: ['admin', 'manager'] }, // New Media Client Management Page
  { to: '/admin/departments/tech', label: 'Tech Department', icon: Code, roles: ['admin', 'manager'] },
  { to: '/admin/departments/finance', label: 'Finance Department', icon: DollarSign, roles: ['admin', 'manager'] },
  { to: '/admin/departments/legal', label: 'Legal Department', icon: Scale, roles: ['admin', 'manager'] },
  { to: '/admin/departments/sales', label: 'Sales Department', icon: TrendingUp, roles: ['admin', 'manager'] },
  { to: '/admin/departments/marketing', label: 'Marketing Department', icon: Megaphone, roles: ['admin', 'manager'] },
  { to: '/admin/departments/research', label: 'R&D Department', icon: FlaskConical, roles: ['admin', 'manager'] }, // New R&D Department
  { to: '/manager', label: 'Manager Dashboard', icon: FolderKanban, roles: ['admin', 'manager'] },
  { to: '/editor', label: 'Editor Dashboard', icon: FileText, roles: ['admin', 'manager', 'editor'] },
  { to: '/client', label: 'My Projects', icon: FolderKanban, roles: ['admin', 'client', 'media_client'] }, // Added media_client
  { to: '/projects', label: 'Projects', icon: Briefcase, roles: ['admin', 'manager'] },
  { to: '/tasks', label: 'Tasks', icon: ListChecks, roles: ['admin', 'manager', 'editor'] },
  { to: '/users', label: 'User Management', icon: Users, roles: ['admin'] },
  { to: '/profile', label: 'My Profile', icon: UserCircle, roles: ['admin', 'manager', 'editor', 'client', 'media_client'] },
];

const Sidebar = () => {
  const { profile, isLoading, session } = useSession();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isLoading || !session) {
    return null;
  }

  const filteredNavItems = navItems.filter(item =>
    profile && item.roles.includes(profile.role)
  );

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-neutral-800 bg-neutral-900 text-white/90 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-center h-16 border-b border-neutral-800">
        <Link to="/" className={cn("text-xl font-bold text-lime-300 drop-shadow-[0_0_20px_rgba(132,204,22,0.35)]", isCollapsed && "hidden")}>
          ProjectFlow
        </Link>
        {isCollapsed && (
          <Link to="/" className="text-xl font-bold text-lime-300 drop-shadow-[0_0_20px_rgba(132,204,22,0.35)]">
            PF
          </Link>
        )}
      </div>
      <nav className="flex-1 py-4 space-y-2">
        {filteredNavItems.map((item) => (
          <Button
            key={item.to}
            variant="ghost"
            className={cn(
              "w-full justify-start text-white/70 hover:bg-neutral-800 hover:text-lime-300",
              location.pathname === item.to && "bg-neutral-800 text-lime-300",
              isCollapsed ? "px-2 justify-center" : "px-4"
            )}
            asChild
          >
            <Link to={item.to}>
              <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-neutral-800 flex flex-col items-center gap-2">
        {session && <UserNav isCollapsed={isCollapsed} />}
        <Collapsible
          open={!isCollapsed}
          onOpenChange={setIsCollapsed}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-8 text-white/70 hover:bg-neutral-800 hover:text-lime-300"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span className="sr-only">{isCollapsed ? 'Expand' : 'Collapse'} Sidebar</span>
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>
    </aside>
  );
};

export default Sidebar;