'use client';

import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentEmergencies } from '@/components/dashboard/recent-emergencies';
import { RecentCats } from '@/components/dashboard/recent-cats';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <StatsCards />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentEmergencies />
        <RecentCats />
      </div>
    </div>
  );
}
