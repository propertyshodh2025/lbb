"use client";

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { User } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

const UserManagementList = () => {
  const { session, profile: currentUserProfile } = useSession();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = users.filter(user =>
      user.first_name?.toLowerCase().includes(lowercasedSearchTerm) ||
      user.last_name?.toLowerCase().includes(lowercasedSearchTerm) ||
      user.email?.toLowerCase().includes(lowercasedSearchTerm) ||
      user.role?.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    if (!session) return;

    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, avatar_url, auth.users(email)');

    if (usersError) {
      toast.error('Error fetching users: ' + usersError.message);
      console.error('Error fetching users:', usersError);
      return;
    }

    const usersWithEmails = usersData.map((profile: any) => ({
      ...profile,
      email: profile.auth.users?.email || 'N/A',
    }));

    setUsers(usersWithEmails);
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase.rpc('get_distinct_roles');
    if (error) {
      console.error('Error fetching roles:', error);
      toast.error('Error fetching roles: ' + error.message);
    } else {
      setRoles(data);
    }
  };

  const handleEdit = (user: Profile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    const { id, first_name, last_name, role } = editingUser;

    const { error } = await supabase
      .from('profiles')
      .update({ first_name, last_name, role })
      .eq('id', id);

    if (error) {
      toast.error('Error updating user: ' + error.message);
      console.error('Error updating user:', error);
    } else {
      toast.success('User updated successfully!');
      setIsEditDialogOpen(false);
      fetchUsers(); // Refresh the list
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    // First, delete the user from auth.users, which will cascade to profiles due to RLS
    const { error: authError } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: userId });

    if (authError) {
      toast.error('Error deleting user: ' + authError.message);
      console.error('Error deleting user:', authError);
    } else {
      toast.success('User deleted successfully!');
      fetchUsers(); // Refresh the list
    }
  };

  const canEditOrDelete = (userRole: string) => {
    if (!currentUserProfile) return false;
    // Admins can edit/delete anyone except other admins (to prevent accidental self-deletion or demotion)
    if (currentUserProfile.role === 'admin') {
      return userRole !== 'admin';
    }
    // Managers can edit/delete clients and editors
    if (currentUserProfile.role === 'manager') {
      return userRole === 'client' || userRole === 'editor';
    }
    return false;
  };

  return (
    <div className="p-6 bg-neutral-900 text-white/90 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-lime-300 drop-shadow-[0_0_20px_rgba(132,204,22,0.35)]">User Management</h1>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md bg-neutral-800 border-neutral-700 text-white/90 placeholder:text-white/50 focus:border-lime-500"
        />
      </div>

      <div className="rounded-lg border border-neutral-800 overflow-hidden shadow-lg">
        <Table>
          <TableHeader className="bg-neutral-800">
            <TableRow className="border-neutral-700">
              <TableHead className="text-lime-300">Avatar</TableHead>
              <TableHead className="text-lime-300">First Name</TableHead>
              <TableHead className="text-lime-300">Last Name</TableHead>
              <TableHead className="text-lime-300">Email</TableHead>
              <TableHead className="text-lime-300">Role</TableHead>
              <TableHead className="text-lime-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-neutral-700 hover:bg-neutral-800/50">
                <TableCell>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white/70">
                      <User size={16} />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-white/90">{user.first_name}</TableCell>
                <TableCell className="text-white/90">{user.last_name}</TableCell>
                <TableCell className="text-white/70">{user.email}</TableCell>
                <TableCell className="text-white/70">{user.role}</TableCell>
                <TableCell className="text-right">
                  {canEditOrDelete(user.role) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="mr-2 bg-neutral-700 border-neutral-600 text-white/80 hover:bg-neutral-600 hover:text-lime-300"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:max-w-[425px] max-h-[90vh] overflow-y-auto scrollbar-hide bg-neutral-900 text-white/90 rounded-2xl glass-border border-neutral-800 z-50">
            <DialogHeader>
              <DialogTitle className="text-white/90">Edit User Profile</DialogTitle>
              <DialogDescription className="text-white/70">
                Make changes to the user's profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right text-white/90">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  value={editingUser.first_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                  className="col-span-3 bg-neutral-800 border-neutral-700 text-white/90"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right text-white/90">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  value={editingUser.last_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                  className="col-span-3 bg-neutral-800 border-neutral-700 text-white/90"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-white/90">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingUser.email || ''}
                  disabled // Email is typically not editable directly here
                  className="col-span-3 bg-neutral-700 border-neutral-600 text-white/60"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right text-white/90">
                  Role
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                  disabled={!canEditOrDelete(editingUser.role)} // Disable role change if current user can't edit this role
                >
                  <SelectTrigger className="col-span-3 bg-neutral-800 border-neutral-700 text-white/90">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700 text-white/90">
                    {roles.map((role) => (
                      <SelectItem key={role} value={role} className="hover:bg-neutral-700">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleSave}
                className="bg-lime-600 hover:bg-lime-700 text-white drop-shadow-[0_0_10px_rgba(132,204,22,0.35)]"
              >
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserManagementList;