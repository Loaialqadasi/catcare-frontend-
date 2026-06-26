// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Cat, ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCats } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import type { Cat as CatType, HealthStatus } from '@/lib/types';


const healthConfig: Record<HealthStatus, { color: string; bgColor: string; label: string }> = {
  healthy: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
    label: 'Healthy',
  },
  needs_attention: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40',
    label: 'Needs Attention',
  },
  injured: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950/40',
    label: 'Injured',
  },
  unknown: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-950/40',
    label: 'Unknown',
  },
};

function RecentCatCard({ cat, index }: { cat: CatType; index: number }) {
  const router = useRouter();
  const health = healthConfig[cat.healthStatus] ?? healthConfig.unknown;

  return (
    <button
      onClick={() => router.push(`/cats/${cat.id}`)}
      className="w-full text-left rounded-lg border border-border/50 overflow-hidden hover:shadow-md transition-all duration-200 group bg-card animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        <img
          src={cat.photoUrl || 'https://placecats.com/millie/400/300'}
          alt={cat.nickname}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placecats.com/millie/400/300';
          }}
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className={cn('text-[10px] px-1.5 py-0 h-5 font-medium backdrop-blur-sm', health.bgColor, health.color)}
          >
            {health.label}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-semibold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors truncate">
          {cat.nickname}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{cat.locationName}</span>
        </div>
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-44" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-lg" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentCats() {
  const [cats, setCats] = useState<CatType[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchCats({ pageSize: 8 });
        setCats(res.items.slice(0, 4));
      } catch {
        setCats([]);
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
              <Cat className="h-4.5 w-4.5 text-amber-500" />
              Recently Added Cats
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Latest cat registrations on campus
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-amber-600 hover:text-amber-700"
            onClick={() => router.push('/cats')}
          >
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {cats.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 mb-3">
              <Cat className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-sm text-muted-foreground">No cats registered yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start by adding a campus cat</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cats.map((cat, index) => (
              <RecentCatCard key={cat.id} cat={cat} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
