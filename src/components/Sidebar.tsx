"use client";

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, LayoutDashboard, Users, FolderKanban, FileText, UserCircle, ChevronLeft, ChevronRight, ListChecks, Briefcase } from 'lucide-react'; // Import Briefcase icon for Projects
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
  { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { to: '/manager', label: 'Manager Dashboard', icon: FolderKanban, roles: ['admin', 'manager'] },
  { to: '/editor', label: 'Editor Dashboard', icon: FileText, roles: ['admin', 'manager', 'editor'] },
  { to: '/client', label: 'My Projects', icon: FolderKanban, roles: ['admin', 'client'] },
  { to: '/projects', label: 'Projects', icon: Briefcase, roles: ['admin', 'manager'] },
  { to: '/tasks', label: 'Tasks', icon: ListChecks, roles: ['admin', 'manager', 'editor'] },
  { to: '/users', label: 'User Management', icon: Users, roles: ['admin'] },
  { to: '/profile', label: 'My Profile', icon: UserCircle, roles: ['admin', 'manager', 'editor', 'client'] },
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
        "hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground p-4 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-center h-16 border-b">
        <Link to="/" className={cn("text-xl font-bold text-sidebar-primary", isCollapsed && "hidden")}>
          ProjectFlow
        </Link>
        {isCollapsed && (
          <Link to="/" className="text-xl font-bold text-sidebar-primary">
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
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              location.pathname === item.to && "bg-sidebar-accent text-sidebar-accent-foreground",
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
      <div className="mt-auto pt-4 border-t border-sidebar-border flex flex-col items-center gap-2">
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
              className="w-full h-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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