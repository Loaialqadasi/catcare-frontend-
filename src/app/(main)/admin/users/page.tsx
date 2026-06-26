'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Users, Shield, BookOpen, Award, Loader2, Plus, Pencil, Trash2, UserPlus, KeyRound, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchAllUsers, updateUserRole, createUser, updateUser, deleteUser, adminResetUserPassword } from '@/lib/api-client';
import type { AdminUser } from '@/lib/api-client';

const roleColors: Record<string, string> = {
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  volunteer: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  manager: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  admin: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

export default function AdminUsersPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'student' });
  const [creating, setCreating] = useState(false);

  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '' });
  const [editing, setEditing] = useState(false);

  // Delete user dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reset password dialog
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AdminUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const isAdmin = user?.role === 'admin';
  // H-1 FIX: Only admins can manage users

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    async function loadUsers() {
      try {
        const data = await fetchAllUsers();
        setUsers(data);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [user, router, isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Prevent changing own role
    if (userId === user?.id) {
      toast.error('You cannot change your own role');
      return;
    }
    setUpdatingRole(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('Role updated', { description: `User role changed to ${newRole}` });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.fullName.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error('All fields are required');
      return;
    }
    if (newUser.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};:'",./<>?\\|`~]/.test(newUser.password)) {
      toast.error('Password must contain at least one special character');
      return;
    }
    setCreating(true);
    try {
      const created = await createUser({
        fullName: newUser.fullName.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: newUser.role,
      });
      setUsers((prev) => [created, ...prev]);
      toast.success('User created successfully');
      setCreateDialogOpen(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'student' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (u: AdminUser) => {
    setEditUser(u);
    setEditForm({ fullName: u.fullName, email: u.email });
    setEditDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!editUser) return;
    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setEditing(true);
    try {
      const updated = await updateUser(editUser.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, fullName: updated.fullName, email: updated.email } : u))
      );
      toast.success('User updated successfully');
      setEditDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setEditing(false);
    }
  };

  const openDeleteDialog = (u: AdminUser) => {
    setDeleteTarget(u);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const openResetPasswordDialog = (u: AdminUser) => {
    setResetPasswordTarget(u);
    setResetPasswordValue('');
    setShowResetPassword(false);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordTarget) return;
    if (resetPasswordValue.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};:'",./<>?\\|`~]/.test(resetPasswordValue)) {
      toast.error('Password must contain at least one special character');
      return;
    }
    setResettingPassword(true);
    try {
      await adminResetUserPassword(resetPasswordTarget.id, resetPasswordValue);
      toast.success('Password reset successfully', { description: `Password for ${resetPasswordTarget.fullName} has been updated` });
      setResetPasswordDialogOpen(false);
      setResetPasswordTarget(null);
      setResetPasswordValue('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  if (!isAdmin) return null;

  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === 'student').length,
    volunteers: users.filter((u) => u.role === 'volunteer').length,
    managers: users.filter((u) => u.role === 'manager').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Students</p>
              <p className="text-xl font-bold text-foreground">{stats.students}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Volunteers</p>
              <p className="text-xl font-bold text-foreground">{stats.volunteers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40">
              <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Managers</p>
              <p className="text-xl font-bold text-foreground">{stats.managers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admins</p>
              <p className="text-xl font-bold text-foreground">{stats.admins}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-base">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(value) => handleRoleChange(u.id, value)}
                          disabled={updatingRole === u.id || u.id === user?.id}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            {updatingRole === u.id ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Updating...
                              </span>
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="volunteer">Volunteer</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {u.id === user?.id && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Cannot change own role</p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openResetPasswordDialog(u)}
                            className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            title="Reset Password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(u)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(u)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            disabled={u.id === user?.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the system. They will be able to log in with these credentials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newFullName">Full Name *</Label>
              <Input
                id="newFullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="Enter full name"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">Email *</Label>
              <Input
                id="newEmail"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@utm.my"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Min 8 chars + special char"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creating} className="bg-amber-500 hover:bg-amber-600 text-white">
              {creating ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creating...</span> : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user&apos;s name and email address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name *</Label>
              <Input
                id="editFullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                placeholder="Enter full name"
                disabled={editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="user@utm.my"
                disabled={editing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editing}>Cancel</Button>
            <Button onClick={handleEditUser} disabled={editing} className="bg-amber-500 hover:bg-amber-600 text-white">
              {editing ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving...</span> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.fullName}</strong> ({deleteTarget?.email})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button onClick={handleDeleteUser} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white">
              {deleting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Deleting...</span> : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetPasswordTarget?.fullName}</strong> ({resetPasswordTarget?.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="resetPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="resetPassword"
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Min 8 chars + special character"
                  className="pr-10"
                  disabled={resettingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters and contain a special character (!@#$%^&amp;*...)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)} disabled={resettingPassword}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={resettingPassword || !resetPasswordValue} className="bg-amber-500 hover:bg-amber-600 text-white">
              {resettingPassword ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Resetting...</span> : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
