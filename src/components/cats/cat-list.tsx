'use client';

// Loai Rafaat — CCU-S1-02 | Cat Management Module

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Cat as CatIcon, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchCats } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { CatCard } from './cat-card';
import type { Cat, HealthStatus, CatFilters } from '@/lib/types';


function CatGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 overflow-hidden">
          <Skeleton className="aspect-[4/3]" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatList() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<HealthStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const router = useRouter();

  const loadCats = useCallback(async () => {
    setLoading(true);
    try {
      const filters: CatFilters = {
        page,
        pageSize: 12,
        search: search || undefined,
        healthStatus: healthFilter || undefined,
      };
      const res = await fetchCats(filters);
      setCats(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.totalItems);
    } catch {
      setCats([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, healthFilter]);

  useEffect(() => {
    loadCats();
  }, [loadCats]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleHealthFilter = (value: string) => {
    setHealthFilter(value === 'all' ? '' : (value as HealthStatus));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setHealthFilter('');
    setPage(1);
  };

  const hasFilters = search || healthFilter;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campus Cats</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'Loading...' : `${totalItems} cat${totalItems !== 1 ? 's' : ''} registered on campus`}
          </p>
        </div>
        <Button
          onClick={() => router.push('/cats/new')}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Cat
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cats by name, location..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={healthFilter} onValueChange={handleHealthFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Health Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="needs_attention">Needs Attention</SelectItem>
            <SelectItem value="injured">Injured</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Cat Grid */}
      {loading ? (
        <CatGridSkeleton />
      ) : cats.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 mb-4">
            <CatIcon className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {hasFilters ? 'No cats match your filters' : 'No cats registered yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasFilters
              ? 'Try adjusting your search or filter criteria'
              : 'Be the first to add a campus cat to the system'}
          </p>
          {!hasFilters && (
            <Button
              onClick={() => router.push('/cats/new')}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Cat
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cats.map((cat, index) => (
              <div
                key={cat.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <CatCard cat={cat} onClick={(catId) => router.push(`/cats/${catId}`)} />
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
