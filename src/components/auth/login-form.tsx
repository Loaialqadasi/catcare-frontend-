'use client';

// Layth Amgad — CCU-S1-01 | Authentication Module

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, Cat } from 'lucide-react';
import { login } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Detect fetch errors that mean "the backend is unreachable" vs "wrong credentials".
 * Browsers throw a TypeError with `message: "Failed to fetch"` for any network-level
 * failure (DNS, connection refused, CORS preflight rejected, etc.) — the actual cause
 * is only visible in the browser DevTools console. We surface a friendlier message.
 */
function describeLoginError(err: unknown): { title: string; description: string } {
  if (err instanceof TypeError && /failed to fetch|networkerror/i.test(err.message)) {
    return {
      title: 'Cannot reach the server',
      description:
        'The backend is unreachable — check that it is running and that NEXT_PUBLIC_API_URL or BACKEND_URL is set correctly. See the browser console for the underlying error.',
    };
  }
  if (err instanceof Error) {
    if (err.message === 'SESSION_EXPIRED') {
      return {
        title: 'Session expired',
        description: 'Your previous session ended. Please sign in again.',
      };
    }
    // Backend returned a 401 with its own message (e.g. "Invalid email or password")
    // or a 500 with an error envelope — surface that directly.
    return {
      title: 'Login failed',
      description: err.message,
    };
  }
  return {
    title: 'Login failed',
    description: 'An unexpected error occurred. Please try again.',
  };
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login: storeLogin } = useAppStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!email.endsWith('@utm.my') && !email.endsWith('@graduate.utm.my')) {
      toast.error('Please use a valid UTM email (e.g. your.name@utm.my)');
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      storeLogin(result.user);
      toast.success('Welcome back!', { description: `Logged in as ${result.user.fullName}` });
      // Hard navigation (full page reload) instead of client-side router.push.
      // This forces the (main) layout to mount fresh and read the just-persisted
      // auth state from localStorage, eliminating a class of "stuck on login"
      // bugs where the layout would briefly see isAuthenticated=false before
      // zustand rehydration completed and immediately redirect back to /login.
      if (typeof window !== 'undefined') {
        window.location.assign('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const { title, description } = describeLoginError(err);
      toast.error(title, { description });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-500/30 mb-4">
            <Cat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">CatCare UTM</h1>
          <p className="text-muted-foreground mt-1">
            Campus Cat Management System
          </p>
        </div>

        <Card className="rounded-2xl shadow-xl border-amber-100/80 backdrop-blur-sm bg-white/80">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to manage campus cats and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@utm.my"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm text-muted-foreground hover:text-amber-600 transition-colors block mb-2"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                >
                  Don&apos;t have an account? Register
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
