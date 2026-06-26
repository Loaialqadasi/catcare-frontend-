'use client';

// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter, usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  LogOut,
  User,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout as apiLogout } from '@/lib/api-client';

const roleColors: Record<string, string> = {
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  volunteer: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  admin: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const roleLabels: Record<string, string> = {
  student: 'Student',
  volunteer: 'Volunteer',
  admin: 'Admin',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout: storeLogout, toggleSidebar } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border/50 bg-card/80 backdrop-blur-md transition-all duration-300'
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Page title based on current route */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {getPageTitle(pathname)}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {getPageDescription(pathname)}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications — placeholder, coming soon.
            Disabled to make it clear the button has no action yet.
            Red dot removed so users don't think they have unread alerts. */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative opacity-60 cursor-not-allowed"
          disabled
          aria-label="Notifications coming soon"
          title="Notifications coming soon"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="sr-only">Notifications coming soon</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors cursor-pointer border border-transparent hover:border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" aria-label="User menu">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white text-xs font-bold">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {user.fullName}
                </p>
                <Badge
                  variant="secondary"
                  className={cn('text-[10px] px-1.5 py-0 h-4 font-medium', roleColors[user.role])}
                >
                  {roleLabels[user.role]}
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                try { await apiLogout(); } catch { /* ignore */ }
                storeLogout();
                router.push('/login');
              }}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/cats') return 'Campus Cats';
  if (pathname.match(/^\/cats\/\d+$/)) return 'Cat Details';
  if (pathname === '/cats/new') return 'Add New Cat';
  if (pathname === '/emergencies') return 'Emergency Reports';
  if (pathname.match(/^\/emergencies\/\d+$/)) return 'Emergency Details';
  if (pathname === '/emergencies/new') return 'Report Emergency';
  if (pathname === '/donations') return 'My Donations';
  if (pathname.match(/^\/donations\/\d+$/)) return 'Donation Details';
  if (pathname === '/donations/new') return 'Make a Donation';
  if (pathname === '/map') return 'Campus Map';
  if (pathname === '/volunteers') return 'Volunteers';
  if (pathname === '/admin') return 'Admin Panel';
  if (pathname === '/admin/donations') return 'Review Donations';
  if (pathname === '/admin/users') return 'Manage Users';
  if (pathname === '/admin/emergencies') return 'Manage Emergencies';
  if (pathname === '/admin/cats') return 'Manage Cats';
  if (pathname === '/profile') return 'My Profile';
  return 'CatCare UTM';
}

function getPageDescription(pathname: string): string {
  if (pathname === '/dashboard') return 'Overview of campus cat management';
  if (pathname === '/cats') return 'Browse and manage registered campus cats';
  if (pathname.match(/^\/cats\/\d+$/)) return 'Detailed cat information';
  if (pathname === '/cats/new') return 'Register a new campus cat';
  if (pathname === '/emergencies') return 'View and manage emergency reports';
  if (pathname.match(/^\/emergencies\/\d+$/)) return 'Emergency report details';
  if (pathname === '/emergencies/new') return 'Submit a new emergency report';
  if (pathname === '/donations') return 'Track your donation history';
  if (pathname.match(/^\/donations\/\d+$/)) return 'Donation details and status';
  if (pathname === '/donations/new') return 'Contribute to campus cat care';
  if (pathname === '/map') return 'Interactive campus map with cat locations';
  if (pathname === '/volunteers') return 'Manage and coordinate volunteers';
  if (pathname === '/admin') return 'System administration';
  if (pathname === '/admin/donations') return 'Review and manage donation submissions';
  if (pathname === '/admin/users') return 'Manage user accounts and roles';
  if (pathname === '/admin/emergencies') return 'Manage and assign emergency reports';
  if (pathname === '/admin/cats') return 'Manage cat records';
  if (pathname === '/profile') return 'Your account information';
  return '';
}
