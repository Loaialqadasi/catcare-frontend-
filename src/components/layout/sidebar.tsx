'use client';

// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cat,
  AlertTriangle,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Heart,
  ClipboardCheck,
  LogOut,
  Shield,
  Users,
  Map,
  HandHeart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { logout as apiLogout } from '@/lib/api-client';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
  route: string;
  /**
   * 'admin'   → only admin role sees this nav item (user management, donation review)
   * 'manager' → manager + admin see this nav item (cat mgmt, emergency mgmt, volunteer review)
   * undefined → everyone (authenticated) sees this nav item
   */
  minRole?: 'manager' | 'admin';
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    section: 'Main',
    route: '/dashboard',
  },
  {
    id: 'cats',
    label: 'All Cats',
    icon: <Cat className="h-5 w-5" />,
    section: 'Main',
    route: '/cats',
  },
  {
    id: 'emergencies',
    label: 'Emergencies',
    icon: <AlertTriangle className="h-5 w-5" />,
    section: 'Main',
    route: '/emergencies',
  },
  {
    id: 'my-donations',
    label: 'My Donations',
    icon: <Heart className="h-5 w-5" />,
    section: 'Main',
    route: '/donations',
  },
  {
    id: 'map',
    label: 'Campus Map',
    icon: <Map className="h-5 w-5" />,
    section: 'Main',
    route: '/map',
  },
  {
    id: 'volunteers',
    label: 'Volunteers',
    icon: <HandHeart className="h-5 w-5" />,
    section: 'Main',
    route: '/volunteers',
  },
  {
    id: 'create-cat',
    label: 'Add Cat',
    icon: <Plus className="h-5 w-5" />,
    section: 'Actions',
    route: '/cats/new',
  },
  {
    id: 'create-emergency',
    label: 'Report Emergency',
    icon: <Plus className="h-5 w-5" />,
    section: 'Actions',
    route: '/emergencies/new',
  },
  {
    id: 'create-donation',
    label: 'Donate',
    icon: <Heart className="h-5 w-5" />,
    section: 'Actions',
    route: '/donations/new',
  },
  {
    id: 'admin-donations',
    label: 'Review Donations',
    icon: <ClipboardCheck className="h-5 w-5" />,
    section: 'Admin',
    route: '/admin/donations',
    minRole: 'admin',
  },
  {
    id: 'admin-users',
    label: 'Manage Users',
    icon: <Users className="h-5 w-5" />,
    section: 'Admin',
    route: '/admin/users',
    minRole: 'admin',
  },
  {
    id: 'admin-emergencies',
    label: 'Manage Emergencies',
    icon: <Shield className="h-5 w-5" />,
    section: 'Admin',
    route: '/admin/emergencies',
    minRole: 'manager',
  },
  {
    id: 'admin-volunteers',
    label: 'Manage Volunteers',
    icon: <HandHeart className="h-5 w-5" />,
    section: 'Admin',
    route: '/admin/volunteers',
    minRole: 'manager',
  },
  {
    id: 'admin-cats',
    label: 'Manage Cats',
    icon: <Cat className="h-5 w-5" />,
    section: 'Admin',
    route: '/admin/cats',
    minRole: 'manager',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="h-5 w-5" />,
    section: 'Account',
    route: '/profile',
  },
];

function SidebarContent({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const { user, logout: storeLogout } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  const sections = ['Main', 'Actions', 'Admin', 'Account'];

  const handleNavigate = (route: string) => {
    router.push(route);
    useAppStore.getState().setSidebarOpen(false);
  };

  // Determine active state based on pathname
  const isActive = (item: NavItem): boolean => {
    // Exact match for top-level routes
    if (item.route === '/dashboard' && pathname === '/dashboard') return true;
    if (item.route === '/cats' && pathname === '/cats') return true;
    if (item.route === '/cats/new' && pathname === '/cats/new') return true;
    if (item.route === '/emergencies' && pathname === '/emergencies') return true;
    if (item.route === '/emergencies/new' && pathname === '/emergencies/new') return true;
    if (item.route === '/donations' && pathname === '/donations') return true;
    if (item.route === '/donations/new' && pathname === '/donations/new') return true;
    if (item.route === '/map' && pathname === '/map') return true;
    if (item.route === '/volunteers' && pathname === '/volunteers') return true;
    if (item.route === '/profile' && pathname === '/profile') return true;
    // Detail pages: highlight the parent list item
    if (item.id === 'cats' && pathname.match(/^\/cats\/\d+$/)) return true;
    if (item.id === 'emergencies' && pathname.match(/^\/emergencies\/\d+$/)) return true;
    if (item.id === 'my-donations' && pathname.match(/^\/donations\/\d+$/)) return true;
    // Admin routes
    if (item.route.startsWith('/admin/') && pathname.startsWith(item.route)) return true;
    return false;
  };

  // Filter items based on role — H-1 FIX: respect minRole for RBAC
  const visibleItems = navItems.filter((item) => {
    if (item.minRole === 'admin' && !isAdmin) return false;
    if (item.minRole === 'manager' && !isManagerOrAdmin) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b border-border/50',
        collapsed && 'justify-center p-3'
      )}>
        <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 shadow-md shadow-amber-500/20">
          <Cat className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-lg font-bold text-foreground truncate">CatCare UTM</h2>
            <p className="text-[10px] text-muted-foreground leading-none">Campus Cat Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1" aria-label="Main navigation">
        {sections.map((section) => {
          const sectionItems = visibleItems.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section} className="mb-2">
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section}
                </p>
              )}
              {collapsed && section !== 'Main' && (
                <Separator className="my-2" />
              )}
              {sectionItems.map((item) => {
                const active = isActive(item);

                const button = (
                  <button
                    onClick={() => handleNavigate(item.route)}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg transition-all duration-200',
                      collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                      active
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <span className={cn(
                      'flex-shrink-0 transition-colors',
                      active && 'text-amber-600 dark:text-amber-400'
                    )}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate text-sm">{item.label}</span>
                    )}
                    {active && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.id} delayDuration={0}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.id}>{button}</div>;
              })}
            </div>
          );
        })}
      </nav>

      {/* Connection Status + Logout */}
      <div className={cn('p-3 border-t border-border/50 space-y-2', collapsed && 'p-2')}>
        <div className={cn(
          'rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800',
          collapsed ? 'p-2' : 'p-3'
        )}>
          <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {!collapsed && (
              <span className="text-[11px] font-medium text-green-700 dark:text-green-400">
                Connected to Server
              </span>
            )}
          </div>
        </div>

        {/* Logout Button */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={async () => {
                  try { await apiLogout(); } catch { /* ignore */ }
                  storeLogout();
                  router.push('/login');
                }}
                aria-label="Sign out"
                className="w-full flex items-center justify-center p-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium text-red-600">
              Sign Out
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={async () => {
              try { await apiLogout(); } catch { /* ignore */ }
              storeLogout();
              router.push('/login');
            }}
            aria-label="Sign out"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="truncate text-sm font-medium">Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ collapsed, onToggleCollapse }: { collapsed: boolean; onToggleCollapse: () => void }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-6 z-50 flex items-center justify-center w-6 h-6 rounded-full border bg-card shadow-sm hover:bg-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <MobileSidebar />
    </>
  );
}

function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <SidebarContent collapsed={false} />
      </SheetContent>
    </Sheet>
  );
}
