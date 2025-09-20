"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, LayoutDashboard, Users, FolderKanban, FileText, UserCircle, ListChecks, Briefcase, Sun, Moon, Building2, FlaskConical, Code, DollarSign, Scale, TrendingUp, Megaphone, UserRound, Handshake, Swords, Trophy } from 'lucide-react'; // Import new icons
import { cn } from '@/lib/utils';
import UserNav from './UserNav';
import { useTheme } from '@/contexts/ThemeContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'editor'] },
  { to: '/admin', label: 'Departments', icon: Building2, roles: ['admin'] },
  { to: '/admin/overview', label: 'Admin Overview', icon: LayoutDashboard, roles: ['admin'] },
  { to: '/admin/departments/media', label: 'Media Production', icon: Briefcase, roles: ['admin', 'manager'] },
  { to: '/admin/departments/sales-management', label: 'Sales Management', icon: Handshake, roles: ['admin', 'manager'] }, // New Sales Management Page
  { to: '/admin/departments/tech', label: 'Tech Department', icon: Code, roles: ['admin', 'manager'] },
  { to: '/admin/departments/finance', label: 'Finance Department', icon: DollarSign, roles: ['admin', 'manager'] },
  { to: '/admin/departments/legal', label: 'Legal Department', icon: Scale, roles: ['admin', 'manager'] },
  { to: '/admin/departments/sales', label: 'Sales Department', icon: TrendingUp, roles: ['admin', 'manager'] },
  { to: '/admin/departments/marketing', label: 'Marketing Department', icon: Megaphone, roles: ['admin', 'manager'] },
  { to: '/admin/departments/research', label: 'R&D Department', icon: FlaskConical, roles: ['admin', 'manager'] },
  { to: '/manager', label: 'Manager Dashboard', icon: FolderKanban, roles: ['admin', 'manager'] },
  { to: '/editor', label: 'Editor Dashboard', icon: FileText, roles: ['admin', 'manager', 'editor'] },
  { to: '/sales-manager-dashboard', label: 'Sales Manager Dashboard', icon: Handshake, roles: ['admin', 'sales_manager'] }, // New Sales Manager Dashboard
  { to: '/warrior-dashboard', label: 'Warrior Dashboard', icon: Swords, roles: ['admin', 'warrior'] }, // New Warrior Dashboard
  { to: '/deal-closer-dashboard', label: 'Deal Closer Dashboard', icon: Trophy, roles: ['admin', 'deal_closer'] }, // New Deal Closer Dashboard
  { to: '/client', label: 'My Projects', icon: FolderKanban, roles: ['admin', 'client'] }, // Kept 'client' for existing data
  { to: '/projects', label: 'Projects', icon: Briefcase, roles: ['admin', 'manager'] },
  { to: '/tasks', label: 'Tasks', icon: ListChecks, roles: ['admin', 'manager', 'editor'] },
  { to: '/users', label: 'User Management', icon: Users, roles: ['admin'] },
  { to: '/profile', label: 'My Profile', icon: UserCircle, roles: ['admin', 'manager', 'editor', 'sales_manager', 'warrior', 'deal_closer', 'client'] },
];

const NavLink = ({ to, children, className, onClick }: { to: string; children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <Link to={to} className={cn("text-sm font-medium transition-colors hover:text-lime-300", className)} onClick={onClick}>
    {children}
  </Link>
);

const AppHeader = () => {
  const { profile, isLoading, session } = useSession();
  const { theme, toggleTheme } = useTheme();

  if (isLoading || !session) {
    return null;
  }

  const filteredNavItems = navItems.filter(item =>
    profile && item.roles.includes(profile.role)
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-900 md:hidden">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link to="/" className="text-lg font-bold text-lime-300 drop-shadow-[0_0_20px_rgba(132,204,22,0.35)]">
          ProjectFlow
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white/70 hover:text-lime-300">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
          {session && <UserNav />}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-neutral-800 text-white/70 hover:bg-neutral-700 hover:text-lime-300 border-neutral-700">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-neutral-900 border-neutral-800 text-white/90">
              <nav className="flex flex-col gap-4 pt-6">
                {filteredNavItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className="text-lg text-white/90 hover:text-lime-300">
                    <item.icon className="mr-2 h-5 w-5 inline-block" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;