// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchPriorityFeed } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import type { EmergencyReport, Priority } from '@/lib/types';


const priorityConfig: Record<Priority, { color: string; bgColor: string; borderColor: string; label: string }> = {
  critical: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950/40',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Critical',
  },
  high: {
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-950/40',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'High',
  },
  medium: {
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950/40',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: 'Medium',
  },
  low: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    label: 'Low',
  },
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  open: { color: 'text-sky-700 dark:text-sky-300', bgColor: 'bg-sky-100 dark:bg-sky-950/40', label: 'Open' },
  in_progress: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40', label: 'In Progress' },
  resolved: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', label: 'Resolved' },
  cancelled: { color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-950/40', label: 'Cancelled' },
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function EmergencyRow({
  emergency,
  index,
}: {
  emergency: EmergencyReport;
  index: number;
}) {
  const router = useRouter();
  const priority = priorityConfig[emergency.priority] ?? priorityConfig.medium;
  const status = statusConfig[emergency.status] ?? statusConfig.open;

  return (
    <button
      onClick={() => router.push(`/emergencies/${emergency.id}`)}
      className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group border border-transparent hover:border-border/50 animate-slide-in-left"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg mt-0.5', priority.bgColor)}>
          {emergency.priority === 'critical' ? (
            <Flame className={cn('h-4 w-4', priority.color)} />
          ) : (
            <AlertTriangle className={cn('h-4 w-4', priority.color)} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              className={cn('text-[10px] px-1.5 py-0 h-4 font-semibold', priority.bgColor, priority.color)}
            >
              {priority.label}
            </Badge>
            <Badge
              variant="secondary"
              className={cn('text-[10px] px-1.5 py-0 h-4', status.bgColor, status.color)}
            >
              {status.label}
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            {emergency.title}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {emergency.cat && (
              <span className="flex items-center gap-1">
                🐱 {emergency.cat.nickname}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(emergency.createdAt)}
            </span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RecentEmergencies() {
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const feed = await fetchPriorityFeed();
        setEmergencies(feed);
      } catch {
        setEmergencies([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <LoadingSkeleton />;

  return (
    <Card className="rounded-xl border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              Priority Feed
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Active emergencies sorted by priority
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-amber-600 hover:text-amber-700"
            onClick={() => router.push('/emergencies')}
          >
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {emergencies.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 mb-3">
              <AlertTriangle className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">No active emergencies</p>
            <p className="text-xs text-muted-foreground mt-1">All clear! 🎉</p>
          </div>
        ) : (
          <>
            {emergencies.slice(0, 5).map((emergency, index) => (
              <EmergencyRow key={emergency.id} emergency={emergency} index={index} />
            ))}
            {emergencies.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-muted-foreground"
                onClick={() => router.push('/emergencies')}
              >
                + {emergencies.length - 5} more emergencies
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
