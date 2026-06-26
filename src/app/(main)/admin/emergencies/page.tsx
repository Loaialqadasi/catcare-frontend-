'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Loader2, MapPin, Clock, Cat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchEmergencies, updateEmergencyStatus } from '@/lib/api-client';
import { toast } from 'sonner';
import type { EmergencyReport, EmergencyStatus, Priority, EmergencyFilters } from '@/lib/types';

const priorityConfig: Record<Priority, { color: string; bgColor: string; label: string }> = {
  critical: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950/40', label: 'Critical' },
  high: { color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-950/40', label: 'High' },
  medium: { color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-950/40', label: 'Medium' },
  low: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', label: 'Low' },
};

const statusConfig: Record<EmergencyStatus, { color: string; bgColor: string; label: string }> = {
  open: { color: 'text-sky-700 dark:text-sky-300', bgColor: 'bg-sky-100 dark:bg-sky-950/40', label: 'Open' },
  in_progress: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40', label: 'In Progress' },
  resolved: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', label: 'Resolved' },
  cancelled: { color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-950/40', label: 'Cancelled' },
};

export default function AdminEmergenciesPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EmergencyStatus | ''>('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const loadData = useCallback(async () => {
    try {
      const filters: EmergencyFilters = {
        pageSize: 100,
        status: statusFilter || undefined,
      };
      const res = await fetchEmergencies(filters);
      setEmergencies(res.items);
    } catch {
      toast.error('Failed to load emergencies');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadData();
    }
  }, [loadData, user]);

  const handleStatusUpdate = async (id: string, newStatus: EmergencyStatus) => {
    setUpdating(id);
    try {
      await updateEmergencyStatus(id, newStatus);
      toast.success('Status updated');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Emergency Management</h2>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : (v as EmergencyStatus)); setLoading(true); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : emergencies.length === 0 ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="py-16 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No emergencies found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {emergencies.map((emergency) => {
            const priority = priorityConfig[emergency.priority] ?? priorityConfig.medium;
            const status = statusConfig[emergency.status] ?? statusConfig.open;
            const isActive = emergency.status === 'open' || emergency.status === 'in_progress';

            return (
              <Card key={emergency.id} className="rounded-xl border-border/50 hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-5 font-semibold', priority.bgColor, priority.color)}>
                          {priority.label}
                        </Badge>
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-5', status.bgColor, status.color)}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{emergency.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{emergency.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {emergency.cat && (
                          <span className="flex items-center gap-1"><Cat className="h-3 w-3" />{emergency.cat.nickname}</span>
                        )}
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{emergency.locationName}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(emergency.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {emergency.status === 'open' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(emergency.id, 'in_progress')} disabled={updating === emergency.id}>
                            {updating === emergency.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Start'}
                          </Button>
                        )}
                        <Button size="sm" onClick={() => handleStatusUpdate(emergency.id, 'resolved')} disabled={updating === emergency.id} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                          Resolve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(emergency.id, 'cancelled')} disabled={updating === emergency.id} className="text-red-600 border-red-200 hover:bg-red-50">
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
