"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import LogoutButton from '@/components/LogoutButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavLink = ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
  <Link to={to} className={cn("text-sm font-medium transition-colors hover:text-primary", className)}>
    {children}
  </Link>
);

const AppHeader = () => {
  const { profile, isLoading } = useSession();

  if (isLoading || !profile) {
    return null; // Don't render header until session and profile are loaded
  }

  const getNavLinks = () => {
    const links = [];
    if (profile.role === 'admin') {
      links.push({ to: '/admin', label: 'Admin Dashboard' });
      links.push({ to: '/manager', label: 'Manager Dashboard' });
      links.push({ to: '/editor', label: 'Editor Dashboard' });
      links.push({ to: '/client-view', label: 'Client Dashboard' }); // Admin can view client dashboard
    } else if (profile.role === 'manager') {
      links.push({ to: '/manager', label: 'Manager Dashboard' });
      links.push({ to: '/editor', label: 'Editor Dashboard' }); // Manager can view editor dashboard
    } else if (profile.role === 'editor') {
      links.push({ to: '/editor', label: 'Editor Dashboard' });
    } else if (profile.role === 'client') {
      links.push({ to: '/client', label: 'My Projects' });
    }
    return links;
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link to="/" className="text-lg font-bold text-primary">
          ProjectFlow
        </Link>
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
          <LogoutButton />
        </nav>
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
                {navLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className="text-lg">
                    {link.label}
                  </NavLink>
                ))}
                <LogoutButton />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;