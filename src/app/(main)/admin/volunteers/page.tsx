'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HandHeart, Clock, CheckCircle2, XCircle, Loader2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchAllVolunteers, updateVolunteerStatus } from '@/lib/api-client';
import type { Volunteer, VolunteerStatus } from '@/lib/types';

const statusConfig: Record<VolunteerStatus, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
  approved: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Approved' },
  rejected: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950/40', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
};

export default function AdminVolunteersPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });

  const loadVolunteers = useCallback(async (page = 1, status = '') => {
    try {
      const result = await fetchAllVolunteers({
        page,
        pageSize: 20,
        status: status || undefined,
      });
      setVolunteers(result.items);
      setPagination(result.pagination);
    } catch {
      toast.error('Failed to load volunteer applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      router.push('/dashboard');
      return;
    }
    loadVolunteers(1, statusFilter);
  }, [user, router, loadVolunteers, statusFilter]);

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(id);
    try {
      await updateVolunteerStatus(id, newStatus);
      setVolunteers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
      );
      toast.success(`Application ${newStatus}`, {
        description: `Volunteer application has been ${newStatus}`,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  const stats = {
    total: pagination.totalItems,
    pending: volunteers.filter((v) => v.status === 'pending').length,
    approved: volunteers.filter((v) => v.status === 'approved').length,
    rejected: volunteers.filter((v) => v.status === 'rejected').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Volunteer Management</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40">
              <HandHeart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Applications</p>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-foreground">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-xl font-bold text-foreground">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-xl font-bold text-foreground">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Volunteer Applications
            </CardTitle>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value === 'all' ? '' : value); setLoading(true); }}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : volunteers.length === 0 ? (
            <div className="text-center py-8">
              <HandHeart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No volunteer applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Interests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteers.map((v) => {
                    const config = statusConfig[v.status];
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.studentName}</TableCell>
                        <TableCell className="text-muted-foreground">{v.studentId}</TableCell>
                        <TableCell className="text-muted-foreground">{v.age}</TableCell>
                        <TableCell className="text-muted-foreground">{v.faculty}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">{v.interests}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn('text-xs', config.bgColor, config.color)}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right">
                          {v.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                                disabled={updatingId === v.id}
                                onClick={() => handleStatusUpdate(v.id, 'approved')}
                              >
                                {updatingId === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                                disabled={updatingId === v.id}
                                onClick={() => handleStatusUpdate(v.id, 'rejected')}
                              >
                                {updatingId === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => { setLoading(true); loadVolunteers(pagination.page - 1, statusFilter); }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => { setLoading(true); loadVolunteers(pagination.page + 1, statusFilter); }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
