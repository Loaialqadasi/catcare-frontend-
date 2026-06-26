// Layth Amgad — CCU-S1-01 | Auth Module
//
// Activity timeline for the profile page. Shows everything the authenticated
// user has done across CatCare — cats registered, care logged, emergencies
// reported, donations made, volunteer applications — as a single chronologically
// sorted timeline with summary stat cards and a per-type filter.
//
// Data is fetched from GET /api/auth/me/activity on mount. The timeline supports
// client-side filtering by activity type (All / Cats / Care / Emergencies /
// Donations / Volunteer) and gracefully handles the loading + empty states.

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Cat as CatIcon,
  HeartPulse,
  Siren,
  HandCoins,
  Award,
  Clock,
  Activity as ActivityIcon,
  ChevronRight,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchMyActivity } from '@/lib/api/activity';
import type {
  ActivityType,
  UserActivity,
  UserActivityResponse,
} from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Visual config — icon + accent color per activity type
// ─────────────────────────────────────────────────────────────────────────────

interface ActivityTypeConfig {
  label: string;
  icon: React.ReactNode;
  /** Tailwind classes for the icon chip background + foreground */
  chipClass: string;
  /** Accent used for the timestamp dot on the timeline rail */
  dotClass: string;
}

const TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
  cat_created: {
    label: 'Cat Registered',
    icon: <CatIcon className="h-4 w-4" />,
    chipClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  care_logged: {
    label: 'Care Logged',
    icon: <HeartPulse className="h-4 w-4" />,
    chipClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    dotClass: 'bg-rose-500',
  },
  emergency_reported: {
    label: 'Emergency Reported',
    icon: <Siren className="h-4 w-4" />,
    chipClass: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    dotClass: 'bg-red-500',
  },
  donation_made: {
    label: 'Donation Made',
    icon: <HandCoins className="h-4 w-4" />,
    chipClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  volunteer_applied: {
    label: 'Volunteer Application',
    icon: <Award className="h-4 w-4" />,
    chipClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    dotClass: 'bg-violet-500',
  },
  volunteer_status_changed: {
    label: 'Application Status',
    icon: <Award className="h-4 w-4" />,
    chipClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    dotClass: 'bg-violet-500',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Filters — each filter is keyed by a logical group; the volunteer group covers
// both `volunteer_applied` and `volunteer_status_changed` events.
// ─────────────────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'cats' | 'care' | 'emergencies' | 'donations' | 'volunteer';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'cats', label: 'Cats' },
  { key: 'care', label: 'Care' },
  { key: 'emergencies', label: 'Emergencies' },
  { key: 'donations', label: 'Donations' },
  { key: 'volunteer', label: 'Volunteer' },
];

function activityMatchesFilter(activity: UserActivity, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'cats') return activity.type === 'cat_created';
  if (filter === 'care') return activity.type === 'care_logged';
  if (filter === 'emergencies') return activity.type === 'emergency_reported';
  if (filter === 'donations') return activity.type === 'donation_made';
  if (filter === 'volunteer')
    return activity.type === 'volunteer_applied' || activity.type === 'volunteer_status_changed';
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Timestamp formatter — relative ("3h ago") for recent, absolute for older
// ─────────────────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  // Older than a week — show the absolute date.
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary stat card — single tile in the stats grid
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  accentClass: string;
}

function StatCard({ label, value, hint, icon, accentClass }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 flex items-start gap-3">
      <div className={cn('flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center', accentClass)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight truncate">{value}</p>
        {hint ? <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</p> : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton — shown while the timeline is being fetched
// ─────────────────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state — user has no activity yet
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onCta }: { onCta: () => void }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/40 mb-4">
        <Inbox className="h-7 w-7 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No activity yet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Once you register a cat, log care, report an emergency, donate, or apply
        as a volunteer, your actions will show up here in chronological order.
      </p>
      <button
        onClick={onCta}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
      >
        Explore the dashboard
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline row — one entry in the chronological list
// ─────────────────────────────────────────────────────────────────────────────

interface TimelineRowProps {
  activity: UserActivity;
  isLast: boolean;
}

function TimelineRow({ activity, isLast }: TimelineRowProps) {
  const router = useRouter();
  const config = TYPE_CONFIG[activity.type];
  const clickable = !!activity.href;

  const handleClick = () => {
    if (activity.href) router.push(activity.href);
  };

  return (
    <li className="relative pl-12 pb-5 last:pb-0">
      {/* Vertical rail */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[18px] top-10 bottom-0 w-px bg-border"
        />
      )}
      {/* Icon chip */}
      <div
        className={cn(
          'absolute left-0 top-0 w-9 h-9 rounded-lg flex items-center justify-center',
          config.chipClass,
        )}
      >
        {config.icon}
      </div>
      {/* Body */}
      <button
        type="button"
        disabled={!clickable}
        onClick={handleClick}
        className={cn(
          'w-full text-left rounded-lg -ml-1 px-1 py-1 transition-colors',
          clickable && 'hover:bg-accent/60 cursor-pointer',
          !clickable && 'cursor-default',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{activity.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {activity.description}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatRelative(activity.createdAt)}
              </span>
              {activity.status && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 font-medium capitalize"
                >
                  {activity.status.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
          {clickable && (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
          )}
        </div>
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────────────────────────────────────

export function ActivityTimeline() {
  const router = useRouter();
  const [data, setData] = useState<UserActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMyActivity();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load activity';
      setError(message);
      // Surface a toast for visibility — the inline error state is also shown.
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Inline async function so setState calls happen in the promise callbacks
    // (not synchronously in the effect body), avoiding cascading renders.
    async function init() {
      try {
        const result = await fetchMyActivity();
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load activity';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, []);

  const filteredActivities = useMemo(() => {
    if (!data) return [];
    return data.activities.filter((a) => activityMatchesFilter(a, filter));
  }, [data, filter]);

  if (loading) return <LoadingSkeleton />;

  if (error && !data) {
    return (
      <Card className="rounded-xl border-red-200 dark:border-red-800">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-red-700 dark:text-red-400 mb-3">
            Couldn&apos;t load your activity. {error}
          </p>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Cats Registered"
          value={summary.totalCats}
          icon={<CatIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
          accentClass="bg-amber-100 dark:bg-amber-950/40"
        />
        <StatCard
          label="Care Actions"
          value={summary.totalCareActions}
          icon={<HeartPulse className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
          accentClass="bg-rose-100 dark:bg-rose-950/40"
        />
        <StatCard
          label="Emergencies"
          value={summary.totalEmergencies}
          icon={<Siren className="h-4 w-4 text-red-600 dark:text-red-400" />}
          accentClass="bg-red-100 dark:bg-red-950/40"
        />
        <StatCard
          label="Donations"
          value={summary.totalDonations}
          hint={
            summary.totalDonations > 0
              ? `RM ${summary.approvedDonationAmount.toFixed(2)} approved · RM ${summary.totalDonationAmount.toFixed(2)} total`
              : undefined
          }
          icon={<HandCoins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          accentClass="bg-emerald-100 dark:bg-emerald-950/40"
        />
      </div>

      {/* ── Volunteer status banner (only if user has applied) ── */}
      {summary.volunteerStatus && (
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
              <Award className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Volunteer application</p>
              <p className="text-xs text-muted-foreground">
                Your latest application status is{' '}
                <span className="font-medium capitalize text-foreground">
                  {summary.volunteerStatus}
                </span>
                .
              </p>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                'capitalize',
                summary.volunteerStatus === 'approved' &&
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                summary.volunteerStatus === 'rejected' &&
                  'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                summary.volunteerStatus === 'pending' &&
                  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
              )}
            >
              {summary.volunteerStatus}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* ── Timeline card ── */}
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-amber-500" />
                Activity History
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Everything you&apos;ve done on CatCare, newest first.
              </CardDescription>
            </div>
            <button
              onClick={() => void load()}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Refresh activity"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count =
                f.key === 'all'
                  ? data.activities.length
                  : data.activities.filter((a) => activityMatchesFilter(a, f.key)).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border transition-colors',
                    active
                      ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                      : 'bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-foreground',
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      'text-[10px] tabular-nums',
                      active ? 'text-white/80' : 'text-muted-foreground/70',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent>
          {data.activities.length === 0 ? (
            <EmptyState onCta={() => router.push('/dashboard')} />
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No activities match this filter.
            </div>
          ) : (
            <ol className="relative">
              {filteredActivities.map((a, idx) => (
                <TimelineRow
                  key={a.id}
                  activity={a}
                  isLast={idx === filteredActivities.length - 1}
                />
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
