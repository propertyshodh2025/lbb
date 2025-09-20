"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/SessionContextProvider';
import LogoutButton from '@/components/LogoutButton';
import { User as UserIcon } from 'lucide-react';

interface UserNavProps {
  isCollapsed?: boolean;
}

const UserNav = ({ isCollapsed = false }: UserNavProps) => {
  const { user, profile, isLoading } = useSession();

  if (isLoading || !user || !profile) {
    return null;
  }

  const displayName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.first_name || user.email;

  const initials = profile.first_name && profile.last_name
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-neutral-800 hover:bg-neutral-700">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-neutral-700 text-white/70">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-neutral-900 text-white/90 border-neutral-800 rounded-2xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white/90">{displayName}</p>
            <p className="text-xs leading-none text-white/70">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-800" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="hover:bg-neutral-800 focus:bg-neutral-800 text-white/90 hover:text-lime-300">
            <Link to="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-neutral-800" />
        <DropdownMenuItem asChild className="hover:bg-neutral-800 focus:bg-neutral-800">
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;