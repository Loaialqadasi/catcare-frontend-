'use client';

/**
 * Email Verification Page
 *
 * NOTE: Email verification is currently DISABLED. Users are auto-verified
 * on registration (emailVerified = true in auth.service.ts). This page
 * remains as a placeholder in case email verification is re-enabled later.
 *
 * When a user navigates here (e.g., from an old email link), they are
 * redirected to the login page since verification is not needed.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Cat, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login after 3 seconds since verification is not required
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-500/30 mb-4">
            <Cat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">CatCare UTM</h1>
        </div>

        <Card className="rounded-2xl shadow-xl border-amber-100/80 backdrop-blur-sm bg-white/80">
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Email Verification</h2>
            <p className="text-sm text-muted-foreground">
              Email verification is not required. Your account is automatically verified
              when you register. You will be redirected to the login page shortly.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
