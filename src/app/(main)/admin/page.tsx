'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ClipboardCheck, AlertTriangle, Cat, HandHeart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchDonationSummary, fetchCats, fetchEmergencies, fetchAllVolunteers } from '@/lib/api-client';
import type { DonationSummary } from '@/lib/types';

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  route: string;
}

export default function AdminPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalUsers: number;
    pendingDonations: number;
    openEmergencies: number;
    totalCats: number;
    pendingVolunteers: number;
  }>({
    totalUsers: 0,
    pendingDonations: 0,
    openEmergencies: 0,
    totalCats: 0,
    pendingVolunteers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      router.push('/dashboard');
      return;
    }

    async function loadStats() {
      try {
        const [donationSummary, catsRes, emergenciesRes, volunteersRes] = await Promise.allSettled([
          fetchDonationSummary(),
          fetchCats({ pageSize: 1 }),
          fetchEmergencies({ pageSize: 100, status: 'open' }),
          fetchAllVolunteers({ pageSize: 1, status: 'pending' }),
        ]);

        const summary = donationSummary.status === 'fulfilled' ? donationSummary.value : null;
        const cats = catsRes.status === 'fulfilled' ? catsRes.value : null;
        const emergencies = emergenciesRes.status === 'fulfilled' ? emergenciesRes.value : null;
        const volunteers = volunteersRes.status === 'fulfilled' ? volunteersRes.value : null;

        setStats({
          totalUsers: 0,
          pendingDonations: summary?.pending ?? 0,
          openEmergencies: emergencies?.pagination?.totalItems ?? 0,
          totalCats: cats?.pagination?.totalItems ?? 0,
          pendingVolunteers: volunteers?.pagination?.totalItems ?? 0,
        });
      } catch {
        // Keep default zeros
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [user, router]);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  const quickLinks = [
    {
      label: 'User Management',
      description: 'Manage user accounts and roles',
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-950/40',
      route: '/admin/users',
    },
    {
      label: 'Volunteer Management',
      description: `${stats.pendingVolunteers} pending applications`,
      icon: <HandHeart className="h-5 w-5" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-950/40',
      route: '/admin/volunteers',
    },
    {
      label: 'Donation Review',
      description: `${stats.pendingDonations} pending review`,
      icon: <ClipboardCheck className="h-5 w-5" />,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-950/40',
      route: '/admin/donations',
    },
    {
      label: 'Emergency Management',
      description: `${stats.openEmergencies} open emergencies`,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-950/40',
      route: '/admin/emergencies',
    },
    {
      label: 'Cat Management',
      description: `${stats.totalCats} registered cats`,
      icon: <Cat className="h-5 w-5" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
      route: '/admin/cats',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {quickLinks.map((link) => (
          <Card
            key={link.route}
            className="rounded-xl border-border/50 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push(link.route)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', link.bgColor)}>
                  <span className={link.color}>{link.icon}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-semibold text-foreground mt-3">{link.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
