'use client';

// Youssef Mostafa — CCU-S1-03 | Emergency Reports Module

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, AlertTriangle, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchEmergencies } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { EmergencyCard } from './emergency-card';
import type { EmergencyReport, EmergencyStatus, Priority, EmergencyFilters } from '@/lib/types';


function EmergencyListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 p-4 space-y-3">
          <div className="h-1 w-full rounded-full bg-muted" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmergencyList() {
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EmergencyStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const router = useRouter();

  const loadEmergencies = useCallback(async () => {
    setLoading(true);
    try {
      const filters: EmergencyFilters = {
        page,
        pageSize: 12,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      };
      const res = await fetchEmergencies(filters);
      setEmergencies(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.totalItems);
    } catch {
      setEmergencies([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => {
    loadEmergencies();
  }, [loadEmergencies]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === 'all' ? '' : (value as EmergencyStatus));
    setPage(1);
  };

  const handlePriorityFilter = (value: string) => {
    setPriorityFilter(value === 'all' ? '' : (value as Priority));
    setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  const hasFilters = statusFilter || priorityFilter;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Emergency Reports</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'Loading...' : `${totalItems} report${totalItems !== 1 ? 's' : ''} submitted`}
          </p>
        </div>
        <Button
          onClick={() => router.push('/emergencies/new')}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Report Emergency
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Emergency Grid */}
      {loading ? (
        <EmergencyListSkeleton />
      ) : emergencies.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 mb-4">
            <AlertTriangle className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {hasFilters ? 'No reports match your filters' : 'No emergency reports yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasFilters
              ? 'Try adjusting your filter criteria'
              : 'Submit the first emergency report'}
          </p>
          {!hasFilters && (
            <Button
              onClick={() => router.push('/emergencies/new')}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Report Emergency
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {emergencies.map((emergency, index) => (
              <div
                key={emergency.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <EmergencyCard
                  emergency={emergency}
                  onClick={(emergencyId) => router.push(`/emergencies/${emergencyId}`)}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
