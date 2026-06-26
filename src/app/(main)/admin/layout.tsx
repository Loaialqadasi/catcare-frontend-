'use client';

import { useAppStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Admin section layout.
 *
 * Access rules (mirror backend RBAC in admin.middleware.ts):
 *   /admin/users         → admin only
 *   /admin/donations     → admin only
 *   /admin/cats          → manager or admin
 *   /admin/emergencies   → manager or admin
 *   /admin/volunteers    → manager or admin
 *   /admin               → manager or admin (dashboard)
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const adminOnlyPages = ['/admin/users', '/admin/donations'];
  const isAdminOnly = adminOnlyPages.some((page) => pathname.startsWith(page));

  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = isAdmin || user?.role === 'manager';
  const isAllowed = isAdminOnly ? isAdmin : isManagerOrAdmin;

  useEffect(() => {
    if (!user || !isAllowed) {
      router.push('/dashboard');
    }
  }, [user, router, isAllowed]);

  if (!user || !isAllowed) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isAdmin ? 'Admin Panel' : 'Manager Panel'}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Manage users, donations, emergencies, and cats'
            : 'Manage cats, emergencies, and volunteer applications'}
        </p>
      </div>
      {children}
    </div>
  );
}
