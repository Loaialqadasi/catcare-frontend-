'use client';

// Youssef Mostafa — CCU-S1-03 | Emergency Reports Module

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Cat } from 'lucide-react';
import type { EmergencyReport, Priority, EmergencyStatus } from '@/lib/types';

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

const statusConfig: Record<EmergencyStatus, { color: string; bgColor: string; label: string }> = {
  open: { color: 'text-sky-700 dark:text-sky-300', bgColor: 'bg-sky-100 dark:bg-sky-950/40', label: 'Open' },
  in_progress: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40', label: 'In Progress' },
  resolved: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', label: 'Resolved' },
  cancelled: { color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-950/40', label: 'Cancelled' },
};

const emergencyTypeLabels: Record<string, string> = {
  injury: 'Injury',
  sickness: 'Sickness',
  missing: 'Missing',
  feeding_urgent: 'Feeding Urgent',
  danger: 'Danger',
  other: 'Other',
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

interface EmergencyCardProps {
  emergency: EmergencyReport;
  onClick?: (emergencyId: string) => void;
}

export function EmergencyCard({ emergency, onClick }: EmergencyCardProps) {
  const priority = priorityConfig[emergency.priority] ?? priorityConfig.medium;
  const status = statusConfig[emergency.status] ?? statusConfig.open;

  return (
    <button
      onClick={() => onClick?.(emergency.id)}
      className={cn(
        'w-full text-left rounded-xl border p-4 transition-all duration-200 group hover:shadow-md',
        'border-border/50 hover:border-border',
        'bg-card'
      )}
    >
      {/* Priority indicator bar */}
      <div className={cn('w-full h-1 rounded-full mb-3 -mx-1', {
        'bg-red-500': emergency.priority === 'critical',
        'bg-orange-500': emergency.priority === 'high',
        'bg-yellow-500': emergency.priority === 'medium',
        'bg-emerald-500': emergency.priority === 'low',
      })} />

      <div className="space-y-3">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
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
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground"
          >
            {emergencyTypeLabels[emergency.emergencyType]}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
          {emergency.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {emergency.description}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {emergency.cat && (
              <span className="flex items-center gap-1">
                <Cat className="h-3 w-3" />
                {emergency.cat.nickname}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {emergency.locationName}
            </span>
          </div>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(emergency.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
