"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DepartmentCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  className?: string;
}

const DepartmentCard = ({ title, description, icon: Icon, to, className }: DepartmentCardProps) => {
  return (
    <Link to={to} className={cn("block h-full", className)}>
      <Card className="h-full flex flex-col justify-between shadow-lg bg-neutral-900 rounded-2xl glass-border hover:border-lime-400 transition-colors duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-white/90">{title}</CardTitle>
          <Icon className="h-8 w-8 text-lime-400" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/70">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default DepartmentCard;