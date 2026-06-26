// Next.js App Router: 404 page.
// Triggered when no route matches. Also useful as a graceful fallback for
// deleted resources (e.g. /cats/[id] for a soft-deleted cat).

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, PawPrint } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
          <PawPrint
            className="h-10 w-10 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
          <p className="text-sm text-muted-foreground">
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
