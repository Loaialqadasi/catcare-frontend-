'use client';

// Loai Rafaat — CCU-S1-02 | Cat Management Module

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  HeartPulse,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCatById, fetchCareHistory } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Cat, HealthStatus, OwnershipTag, CareHistoryEntry, CareType } from '@/lib/types';


const healthConfig: Record<HealthStatus, { color: string; bgColor: string; label: string; icon: string }> = {
  healthy: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    label: 'Healthy',
    icon: '💚',
  },
  needs_attention: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    label: 'Needs Attention',
    icon: '💛',
  },
  injured: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800',
    label: 'Injured',
    icon: '❤️‍🩹',
  },
  unknown: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-950/40 border-gray-200 dark:border-gray-800',
    label: 'Unknown',
    icon: '❓',
  },
};

const ownershipLabels: Record<OwnershipTag, string> = {
  stray: 'Stray',
  adopted: 'Adopted',
  campus_managed: 'Campus Managed',
  unknown: 'Unknown',
};

const ownershipColors: Record<OwnershipTag, string> = {
  stray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  adopted: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  campus_managed: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  unknown: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CatDetailProps {
  catId: string;
}

export function CatDetail({ catId }: CatDetailProps) {
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!catId) return;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchCatById(catId);
        setCat(data);
      } catch {
        setCat(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [catId]);

  if (loading) return <DetailSkeleton />;

  if (!cat) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Cat not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/cats')}>
          Go Back
        </Button>
      </div>
    );
  }

  const health = healthConfig[cat.healthStatus] ?? healthConfig.unknown;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/cats')}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cat Photo */}
        <div className="lg:col-span-2">
          <Card className="rounded-xl overflow-hidden border-border/50">
            <div className="aspect-square relative bg-muted">
              <Image
                src={cat.photoUrl || 'https://placecats.com/millie/400/300'}
                alt={cat.nickname}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placecats.com/millie/400/300';
                }}
              />
            </div>
          </Card>
        </div>

        {/* Cat Info */}
        <div className="lg:col-span-3 space-y-5">
          {/* Name & Badges */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{cat.nickname}</h1>
              <Badge
                variant="outline"
                className={cn('text-sm px-3 py-0.5 font-medium border', health.bgColor, health.color)}
              >
                {health.icon} {health.label}
              </Badge>
              <Badge
                variant="secondary"
                className={cn('text-sm px-3 py-0.5', ownershipColors[cat.ownershipTag] ?? ownershipColors.unknown)}
              >
                {ownershipLabels[cat.ownershipTag] ?? 'Unknown'}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {cat.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-medium">Location</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{cat.locationName}</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HeartPulse className="h-4 w-4" />
                  <span className="text-xs font-medium">Health</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{health.label}</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-medium">Ownership</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {ownershipLabels[cat.ownershipTag] ?? 'Unknown'}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Registered</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(cat.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Report Emergency Button */}
          <Button
            onClick={() => {
              router.push(`/emergencies/new?catId=${cat.id}`);
            }}
            className="w-full"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Emergency for {cat.nickname}
          </Button>
        </div>
      </div>

      {/* Care History */}
      <CareHistorySection catId={cat.id} />
    </div>
  );
}

const careTypeConfig: Record<CareType, { icon: string; label: string; color: string; bgColor: string }> = {
  feeding: { icon: '🍖', label: 'Feeding', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40' },
  medical: { icon: '💊', label: 'Medical', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950/40' },
  grooming: { icon: '✂️', label: 'Grooming', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-950/40' },
  shelter: { icon: '🏠', label: 'Shelter', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40' },
  rescue: { icon: '🚨', label: 'Rescue', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-950/40' },
  other: { icon: '📋', label: 'Other', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-950/40' },
};

function CareHistorySection({ catId }: { catId: string }) {
  const [careHistory, setCareHistory] = useState<CareHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchCareHistory(catId);
        setCareHistory(data);
      } catch {
        setCareHistory([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [catId]);

  if (loading) {
    return (
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Care History</h2>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border/50">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Care History</h2>
        {careHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No care history recorded yet.</p>
        ) : (
          <div className="space-y-0">
            {careHistory.map((entry, i) => {
              const config = careTypeConfig[entry.careType] ?? careTypeConfig.other;
              return (
                <div key={entry.id} className="flex gap-4">
                  {/* Line + Circle */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                      config.bgColor
                    )}>
                      {config.icon}
                    </div>
                    {i < careHistory.length - 1 && (
                      <div className="w-0.5 flex-1 min-h-[24px] bg-gray-200 dark:bg-gray-700" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge
                        variant="secondary"
                        className={cn('text-[10px] px-1.5 py-0 h-5', config.bgColor, config.color)}
                      >
                        {config.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">by {entry.performedBy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
