'use client';

// Next.js App Router: route-level error boundary.
// Catches runtime errors in any route segment below this file and lets the
// user recover without a full page reload. Must be a Client Component.

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Route error boundary:', error);
  }, [error]);

  return (
    <div
      className="min-h-[60vh] flex items-center justify-center p-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while rendering this page. You can try
            again, or return home.
          </p>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground/70 font-mono break-all">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button onClick={reset} size="sm">
            <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/dashboard">
              <Home className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Go home
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
