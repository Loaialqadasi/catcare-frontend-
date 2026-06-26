// Loading skeleton for the (main) route group — shown while the layout
// validates the user's session and the first data fetch resolves.

import { Skeleton } from '@/components/ui/skeleton';

export default function MainLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading CatCare…</span>
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"
          role="status"
        />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
