'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Plus, ArrowLeft, Check, Clock, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchMyDonations } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import type { Donation, DonationStatus } from '@/lib/types';


const statusConfig: Record<DonationStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  reviewed: {
    label: 'Reviewed',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    icon: <Check className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

function ProgressTracker({ status }: { status: DonationStatus }) {
  const stages = [
    { key: 'submitted', label: 'Submitted', completed: true },
    { key: 'pending', label: 'Pending', completed: true },
    { key: 'reviewed', label: 'Reviewed', completed: ['reviewed', 'approved', 'rejected'].includes(status) },
    { key: 'final', label: status === 'rejected' ? 'Rejected' : 'Approved', completed: ['approved', 'rejected'].includes(status) },
  ];

  const currentStage = status === 'pending' ? 1 : status === 'reviewed' ? 2 : ['approved', 'rejected'].includes(status) ? 3 : 0;

  return (
    <div className="flex items-center w-full mt-3">
      {stages.map((stage, idx) => (
        <div key={stage.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                stage.completed
                  ? idx === 3 && status === 'rejected'
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-emerald-500 border-emerald-500 text-white'
                  : idx === currentStage
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-muted border-border text-muted-foreground'
              )}
            >
              {stage.completed ? <Check className="h-3.5 w-3.5" /> : idx + 1}
            </div>
            <span className="text-[10px] mt-1 text-muted-foreground text-center">{stage.label}</span>
          </div>
          {idx < stages.length - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 -mt-4',
                stages[idx + 1].completed
                  ? status === 'rejected' && idx === 2
                    ? 'bg-red-300'
                    : 'bg-emerald-300'
                  : 'bg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-xl"><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
      ))}
    </div>
  );
}

export function MyDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchMyDonations();
        setDonations(res.items);
      } catch {
        setDonations([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <ListSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">My Donations</h2>
        <Button onClick={() => router.push('/donations/new')} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Donate Now
        </Button>
      </div>

      {donations.length === 0 ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="py-16 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">No donations yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your donation contributions will appear here</p>
            <Button onClick={() => router.push('/donations/new')} className="mt-6 bg-amber-500 hover:bg-amber-600 text-white">
              Make Your First Donation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {donations.map((donation) => {
            const cfg = statusConfig[donation.status] ?? statusConfig.pending;
            return (
              <Card
                key={donation.id}
                className="rounded-xl border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/donations/${donation.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">RM {donation.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(donation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-xs px-2.5 py-0.5 font-medium border', cfg.bgColor, cfg.color)}>
                      {cfg.icon}
                      <span className="ml-1">{cfg.label}</span>
                    </Badge>
                  </div>
                  {donation.note && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{donation.note}</p>
                  )}
                  {donation.rejectionReason && (
                    <p className="text-sm text-red-600 dark:text-red-400 line-clamp-1">Reason: {donation.rejectionReason}</p>
                  )}
                  <ProgressTracker status={donation.status} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
