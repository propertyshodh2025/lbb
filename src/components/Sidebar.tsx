"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, LayoutDashboard, Users, FolderKanban, FileText, UserCircle } from 'lucide-react';
import LogoutButton from './LogoutButton';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'editor', 'client'] },
  { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { to: '/manager', label: 'Manager Dashboard', icon: FolderKanban, roles: ['admin', 'manager'] },
  { to: '/editor', label: 'Editor Dashboard', icon: FileText, roles: ['admin', 'manager', 'editor'] },
  { to: '/client', label: 'My Projects', icon: FolderKanban, roles: ['admin', 'client'] },
  { to: '/profile', label: 'My Profile', icon: UserCircle, roles: ['admin', 'manager', 'editor', 'client'] },
];

const Sidebar = () => {
  const { profile, isLoading, session } = useSession();
  const location = useLocation();

  if (isLoading || !session) {
    return null; // Don't render sidebar if not authenticated or loading
  }

  const filteredNavItems = navItems.filter(item =>
    profile && item.roles.includes(profile.role)
  );

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground p-4">
      <div className="flex items-center justify-center h-16 border-b">
        <Link to="/" className="text-xl font-bold text-sidebar-primary">
          ProjectFlow
        </Link>
      </div>
      <nav className="flex-1 py-4 space-y-2">
        {filteredNavItems.map((item) => (
          <Button
            key={item.to}
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              location.pathname === item.to && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
            asChild
          >
            <Link to={item.to}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <LogoutButton />
      </div>
    </aside>
  );
};

export default Sidebar;