'use client';

// Youssef Mostafa — CCU-S1-03 | Emergency Reports Module

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Cat,
  AlertTriangle,
  CheckCircle2,
  Flame,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchEmergencyById,
  updateEmergencyStatus,
} from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import type { EmergencyReport, Priority, EmergencyStatus } from '@/lib/types';
import { toast } from 'sonner';


const priorityConfig: Record<Priority, { color: string; bgColor: string; borderColor: string; label: string; icon: React.ReactNode }> = {
  critical: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800',
    borderColor: 'border-red-300 dark:border-red-700',
    label: 'Critical',
    icon: <Flame className="h-5 w-5 text-red-600" />,
  },
  high: {
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    borderColor: 'border-orange-300 dark:border-orange-700',
    label: 'High',
    icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
  },
  medium: {
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    label: 'Medium',
    icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
  },
  low: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    label: 'Low',
    icon: <Info className="h-5 w-5 text-emerald-600" />,
  },
};

const statusConfig: Record<EmergencyStatus, { color: string; bgColor: string; label: string }> = {
  open: { color: 'text-sky-700 dark:text-sky-300', bgColor: 'bg-sky-100 dark:bg-sky-950/40', label: 'Open' },
  in_progress: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40', label: 'In Progress' },
  resolved: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', label: 'Resolved' },
  cancelled: { color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-950/40', label: 'Cancelled' },
};

const emergencyTypeLabels: Record<string, { label: string; icon: string }> = {
  injury: { label: 'Injury', icon: '🩹' },
  sickness: { label: 'Sickness', icon: '🤒' },
  missing: { label: 'Missing', icon: '🔍' },
  feeding_urgent: { label: 'Feeding Urgent', icon: '🍽️' },
  danger: { label: 'Danger', icon: '⚠️' },
  other: { label: 'Other', icon: '📋' },
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface EmergencyDetailProps {
  emergencyId: string;
}

export function EmergencyDetail({ emergencyId }: EmergencyDetailProps) {
  const [emergency, setEmergency] = useState<EmergencyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const { user } = useAppStore();

  // H-12 FIX: Only admin users can change emergency status
  const canUpdateStatus = user?.role === 'admin';

  useEffect(() => {
    if (!emergencyId) return;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchEmergencyById(emergencyId);
        setEmergency(data);
      } catch {
        setEmergency(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [emergencyId]);

  const handleStatusUpdate = async (newStatus: EmergencyStatus) => {
    if (!emergency) return;
    if (emergency.status === newStatus) return;

    setUpdating(true);
    try {
      const updated = await updateEmergencyStatus(emergency.id, newStatus);
      setEmergency(updated);
      toast.success('Status updated', {
        description: `Emergency marked as ${statusConfig[newStatus].label}`,
      });
    } catch (err) {
      toast.error('Failed to update status', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (!emergency) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Emergency report not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/emergencies')}>
          Go Back
        </Button>
      </div>
    );
  }

  const priority = priorityConfig[emergency.priority] ?? priorityConfig.medium;
  const status = statusConfig[emergency.status] ?? statusConfig.open;
  const typeInfo = emergencyTypeLabels[emergency.emergencyType] ?? { label: emergency.emergencyType, icon: '📋' };
  const isActive = emergency.status === 'open' || emergency.status === 'in_progress';

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/emergencies')}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>

      {/* Priority bar */}
      <div className={cn('w-full h-1.5 rounded-full', {
        'bg-red-500': emergency.priority === 'critical',
        'bg-orange-500': emergency.priority === 'high',
        'bg-yellow-500': emergency.priority === 'medium',
        'bg-emerald-500': emergency.priority === 'low',
      })} />

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl border',
            priority.bgColor
          )}>
            {priority.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {emergency.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge
                variant="outline"
                className={cn('text-sm px-3 py-0.5 font-medium border', priority.bgColor, priority.color)}
              >
                {priority.label} Priority
              </Badge>
              <Badge
                variant="secondary"
                className={cn('text-sm px-3 py-0.5', status.bgColor, status.color)}
              >
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-0.5">
                {typeInfo.icon} {typeInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-4">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {emergency.description}
          </p>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Location</span>
            </div>
            <p className="text-sm font-medium text-foreground leading-tight">{emergency.locationName}</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Reported</span>
            </div>
            <p className="text-sm font-medium text-foreground leading-tight">
              {new Date(emergency.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Last Updated</span>
            </div>
            <p className="text-sm font-medium text-foreground leading-tight">
              {new Date(emergency.updatedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Cat className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Cat</span>
            </div>
            <p className="text-sm font-medium text-foreground leading-tight">
              {emergency.cat ? emergency.cat.nickname : 'Unidentified'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coordinates */}
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Coordinates</p>
          <p className="text-sm font-mono text-foreground">
            {emergency.latitude != null && emergency.longitude != null
              ? `${emergency.latitude.toFixed(4)}, ${emergency.longitude.toFixed(4)}`
              : 'Not available'}
          </p>
        </CardContent>
      </Card>

      {/* Status Actions — H-12 FIX: Only admin can update status */}
      {isActive && canUpdateStatus && (
        <Card className="rounded-xl border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {emergency.status === 'open' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={updating}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/40"
                >
                  <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                  Mark In Progress
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('resolved')}
                disabled={updating}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Mark Resolved
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={updating}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-950/40"
              >
                Cancel Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolved Info */}
      {(emergency.status === 'resolved' || emergency.status === 'cancelled') && emergency.resolvedAt && (
        <Card className="rounded-xl border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {emergency.status === 'resolved' ? 'Resolved' : 'Cancelled'}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {new Date(emergency.resolvedAt).toLocaleString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
