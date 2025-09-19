"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import LogoutButton from '@/components/LogoutButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, LayoutDashboard, Users, FolderKanban, FileText, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  { to: '/users', label: 'User Management', icon: Users, roles: ['admin'] }, // New nav item
  { to: '/profile', label: 'My Profile', icon: UserCircle, roles: ['admin', 'manager', 'editor', 'client'] },
];

const NavLink = ({ to, children, className, onClick }: { to: string; children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <Link to={to} className={cn("text-sm font-medium transition-colors hover:text-primary", className)} onClick={onClick}>
    {children}
  </Link>
);

const AppHeader = () => {
  const { profile, isLoading, session } = useSession();

  if (isLoading || !session) {
    return null;
  }

  const filteredNavItems = navItems.filter(item =>
    profile && item.roles.includes(profile.role)
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background md:hidden"> {/* Only show header on mobile */}
      <div className="container flex h-16 items-center justify-between py-4">
        <Link to="/" className="text-lg font-bold text-primary">
          ProjectFlow
        </Link>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 pt-6">
                {filteredNavItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className="text-lg">
                    <item.icon className="mr-2 h-5 w-5 inline-block" />
                    {item.label}
                  </NavLink>
                ))}
                {session && <LogoutButton />}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;