'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, Clock, AlertCircle, XCircle, Calendar, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchDonationById } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import type { Donation, DonationStatus } from '@/lib/types';


const statusConfig: Record<DonationStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', icon: <Clock className="h-4 w-4" /> },
  reviewed: { label: 'Reviewed', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', icon: <AlertCircle className="h-4 w-4" /> },
  approved: { label: 'Approved', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', icon: <Check className="h-4 w-4" /> },
  rejected: { label: 'Rejected', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800', icon: <XCircle className="h-4 w-4" /> },
};

function VerticalProgressTracker({ donation }: { donation: Donation }) {
  const stages = [
    { label: 'Submitted', date: donation.createdAt, completed: true, description: 'Your donation has been submitted' },
    { label: 'Pending Review', date: donation.createdAt, completed: true, description: 'Waiting for admin to review' },
    { label: 'Reviewed', date: donation.reviewedAt, completed: ['reviewed', 'approved', 'rejected'].includes(donation.status), description: 'An admin has reviewed your donation' },
    { label: donation.status === 'rejected' ? 'Rejected' : 'Approved', date: donation.reviewedAt, completed: ['approved', 'rejected'].includes(donation.status), description: donation.status === 'rejected' ? `Reason: ${donation.rejectionReason || 'Not specified'}` : 'Your donation has been approved. Thank you!' },
  ];

  return (
    <div className="space-y-0">
      {stages.map((stage, idx) => (
        <div key={idx} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0',
                stage.completed
                  ? donation.status === 'rejected' && idx === 3
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-muted border-border text-muted-foreground'
              )}
            >
              {stage.completed ? <Check className="h-4 w-4" /> : idx + 1}
            </div>
            {idx < stages.length - 1 && (
              <div className={cn('w-0.5 h-8', stages[idx + 1].completed ? (donation.status === 'rejected' && idx === 2 ? 'bg-red-300' : 'bg-emerald-300') : 'bg-border')} />
            )}
          </div>
          <div className="pb-4">
            <p className={cn('font-medium text-sm', stage.completed ? 'text-foreground' : 'text-muted-foreground')}>{stage.label}</p>
            {stage.date && stage.completed && (
              <p className="text-xs text-muted-foreground">{new Date(stage.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            )}
            <p className={cn('text-xs mt-0.5', donation.status === 'rejected' && idx === 3 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>{stage.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DonationDetailProps {
  donationId: string;
}

export function DonationDetail({ donationId }: DonationDetailProps) {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!donationId) return;
    async function load() {
      try {
        const data = await fetchDonationById(donationId);
        setDonation(data);
      } catch { setDonation(null); } finally { setLoading(false); }
    }
    load();
  }, [donationId]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-60 w-full" /></div>;

  if (!donation) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Donation not found</p>
      <Button variant="outline" className="mt-4" onClick={() => router.push('/donations')}>Go Back</Button>
    </div>
  );

  const cfg = statusConfig[donation.status] ?? statusConfig.pending;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => router.push('/donations')} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />Go Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Info */}
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">RM {donation.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</h2>
              <Badge variant="outline" className={cn('text-sm px-3 py-1 font-medium border', cfg.bgColor, cfg.color)}>
                {cfg.icon}<span className="ml-1">{cfg.label}</span>
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" /><span>{donation.donorName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /><span>{donation.donorEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /><span>Submitted {new Date(donation.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {donation.note && (
              <Card className="rounded-lg bg-muted/50"><CardContent className="p-3"><p className="text-sm text-foreground">{donation.note}</p></CardContent></Card>
            )}

            {donation.rejectionReason && (
              <Card className="rounded-lg border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Rejection Reason:</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{donation.rejectionReason}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-6">Donation Progress</h3>
            <VerticalProgressTracker donation={donation} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
