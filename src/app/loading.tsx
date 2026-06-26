// Next.js App Router: route-level loading skeleton.
// Shown immediately while any route segment below this file streams in.

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div
      className="min-h-[60vh] space-y-6 p-4 sm:p-6 lg:p-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading page content…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
