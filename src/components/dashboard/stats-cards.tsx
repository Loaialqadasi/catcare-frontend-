// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Cat, AlertTriangle, HeartPulse, ShieldAlert, Heart, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

import { fetchCats, fetchEmergencies, fetchPriorityFeed, fetchDonationSummary } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  delay?: number;
}

function StatCard({ title, value, icon, color, bgColor, description, delay = 0 }: StatCardProps) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <Card className="rounded-xl border-border/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold text-foreground animate-count-up" style={{ animationDelay: `${delay + 100}ms` }}>{value}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl transition-transform group-hover:scale-110', bgColor)}>
              <span className={cn('text-xl', color)}>{icon}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsCards() {
  const { user } = useAppStore();
  const isAdmin = user?.role === 'admin';
  const [stats, setStats] = useState({
    totalCats: 0,
    openEmergencies: 0,
    healthyCats: 0,
    criticalReports: 0,
    totalDonations: 0,
    pendingDonations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      // Build the list of fetches; only fetch donation summary for admin
      const fetches: Promise<any>[] = [
        fetchCats({ pageSize: 100 }),
        fetchEmergencies({ pageSize: 100 }),
        fetchPriorityFeed(),
      ];
      if (isAdmin) {
        fetches.push(fetchDonationSummary());
      }

      const results = await Promise.allSettled(fetches);

      const catsRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const emergenciesRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const priorityFeed = results[2].status === 'fulfilled' ? results[2].value : null;
      const donationSummary = isAdmin && results[3]?.status === 'fulfilled' ? results[3].value : null;

      // Log any failures for debugging
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.warn(`Stats fetch failed for index ${i}:`, r.reason);
        }
      });

      setStats({
        totalCats: catsRes?.pagination?.totalItems ?? 0,
        openEmergencies: emergenciesRes?.items?.filter(
          (e) => e.status === 'open' || e.status === 'in_progress'
        ).length ?? 0,
        healthyCats: catsRes?.items?.filter((c) => c.healthStatus === 'healthy').length ?? 0,
        criticalReports: priorityFeed?.filter((e) => e.priority === 'critical' || e.priority === 'high').length ?? 0,
        totalDonations: donationSummary?.total ?? 0,
        pendingDonations: donationSummary?.pending ?? 0,
      });

      setLoading(false);
    }

    loadStats();
  }, [isAdmin]);

  if (loading) return <LoadingSkeleton count={isAdmin ? 6 : 4} />;

  // Non-admin users don't see donation stat cards
  const donationCards = isAdmin ? (
    <>
      <StatCard
        title="Total Donations"
        value={stats.totalDonations}
        icon={<Heart className="h-5 w-5" />}
        color="text-rose-600 dark:text-rose-400"
        bgColor="bg-rose-100 dark:bg-rose-950/40"
        description="Contributions received"
        delay={0.35}
      />
      <StatCard
        title="Pending Donations"
        value={stats.pendingDonations}
        icon={<Clock className="h-5 w-5" />}
        color="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-100 dark:bg-amber-950/40"
        description="Awaiting review"
        delay={0.4}
      />
    </>
  ) : null;

  return (
    <div className={cn('grid gap-4', isAdmin ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')}>
      <StatCard
        title="Total Cats"
        value={stats.totalCats}
        icon={<Cat className="h-5 w-5" />}
        color="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-100 dark:bg-amber-950/40"
        description="Registered campus cats"
        delay={0}
      />
      <StatCard
        title="Open Emergencies"
        value={stats.openEmergencies}
        icon={<AlertTriangle className="h-5 w-5" />}
        color="text-red-600 dark:text-red-400"
        bgColor="bg-red-100 dark:bg-red-950/40"
        description="Needs attention"
        delay={0.1}
      />
      <StatCard
        title="Healthy Cats"
        value={stats.healthyCats}
        icon={<HeartPulse className="h-5 w-5" />}
        color="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-100 dark:bg-emerald-950/40"
        description="In good condition"
        delay={0.2}
      />
      <StatCard
        title="Urgent Reports"
        value={stats.criticalReports}
        icon={<ShieldAlert className="h-5 w-5" />}
        color="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-100 dark:bg-orange-950/40"
        description="Critical & high priority"
        delay={0.3}
      />
      {donationCards}
    </div>
  );
}
