'use client';

// Loai Rafaat — CCU-S1-02 | Cat Management Module

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
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

const ownershipLabels: Record<string, string> = {
  stray: 'Stray',
  adopted: 'Adopted',
  campus_managed: 'Campus Cat',
  unknown: 'Unknown',
};

interface CatCardProps {
  cat: CatType;
  onClick?: (catId: string) => void;
}

export function CatCard({ cat, onClick }: CatCardProps) {
  const health = healthConfig[cat.healthStatus] ?? healthConfig.unknown;

  return (
    <button
      onClick={() => onClick?.(cat.id)}
      className="w-full text-left rounded-xl border border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 group bg-card"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        <Image
          src={cat.photoUrl || 'https://placecats.com/millie/400/300'}
          alt={cat.nickname}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Replace with fallback on error
            const target = e.target as HTMLImageElement;
            target.src = 'https://placecats.com/millie/400/300';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <Badge
            variant="secondary"
            className={cn('text-[10px] px-1.5 py-0 h-5 font-medium backdrop-blur-sm', health.bgColor, health.color)}
          >
            {health.label}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 font-medium backdrop-blur-sm bg-white/80 dark:bg-black/50 text-foreground"
          >
            {ownershipLabels[cat.ownershipTag]}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors truncate">
            {cat.nickname}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {cat.description || 'No description available.'}
        </p>
        <div className="flex items-center gap-1 mt-2.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{cat.locationName}</span>
        </div>
      </div>
    </button>
  );
}
