// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Calendar,
  Shield,
  LogOut,
  BookOpen,
  Award,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Activity as ActivityIcon,
  UserCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { logout as apiLogout, changePassword } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ActivityTimeline } from './activity-timeline';


const roleColors: Record<string, string> = {
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  volunteer: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  admin: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const roleDescriptions: Record<string, { desc: string; icon: React.ReactNode }> = {
  student: {
    desc: 'Can view cats and report emergencies',
    icon: <BookOpen className="h-4 w-4" />,
  },
  volunteer: {
    desc: 'Can manage cats and update emergency statuses',
    icon: <Award className="h-4 w-4" />,
  },
  admin: {
    desc: 'Full system access and management',
    icon: <Shield className="h-4 w-4" />,
  },
};

export function UserProfile() {
  const { user, logout } = useAppStore();
  const router = useRouter();

  // Active tab — "profile" (account details + password) or "activity" (timeline)
  const [tab, setTab] = useState<'profile' | 'activity'>('profile');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error('Current password is required');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};:'",./<>?\\|`~]/.test(newPassword)) {
      toast.error('New password must contain at least one special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try { await apiLogout(); } catch { /* ignore — cookie may already be cleared */ }
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleInfo = roleDescriptions[user.role] || roleDescriptions.student;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in-up">
      {/* Profile Header */}
      <Card className="rounded-xl border-border/50 overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
        <CardContent className="p-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-amber-500 text-white text-2xl font-bold flex items-center justify-center border-4 border-card shadow-lg">
                {initials}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">{user.fullName}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={cn('text-sm px-3 py-1 font-medium self-start sm:self-auto', roleColors[user.role])}
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — Profile (account details + password) | Activity (timeline) */}
      <div className="flex items-center gap-1 border-b border-border/60">
        <button
          onClick={() => setTab('profile')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            tab === 'profile'
              ? 'border-amber-500 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          aria-current={tab === 'profile' ? 'page' : undefined}
        >
          <UserCircle className="h-4 w-4" />
          Profile
        </button>
        <button
          onClick={() => setTab('activity')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            tab === 'activity'
              ? 'border-amber-500 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          aria-current={tab === 'activity' ? 'page' : undefined}
        >
          <ActivityIcon className="h-4 w-4" />
          Activity &amp; History
        </button>
      </div>

      {tab === 'activity' ? (
        <ActivityTimeline />
      ) : (
        <>
          {/* Role Info */}
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40">
                  {roleInfo.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Role Permissions</p>
                  <p className="text-xs text-muted-foreground">{roleInfo.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Details</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium text-foreground">{user.fullName}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(user.updatedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10"
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars + special character"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg"
                >
                  {changingPassword ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Changing Password...
                    </span>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="rounded-xl border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-red-700 dark:text-red-400">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sign out of your account on this device.
              </p>
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
