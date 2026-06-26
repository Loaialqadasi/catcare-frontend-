'use client';

// Layth Amgad — CCU-S1-01 | Authentication Module

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, Cat, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { register } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { login: storeLogin } = useAppStore();
  const router = useRouter();

  // Inline validation with memoization
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errs.fullName = 'Full name is required';
    } else if (trimmedName.split(/\s+/).length < 2) {
      errs.fullName = 'Full name must contain at least two words (e.g. Ahmad Ali)';
    }
    if (!email) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address';
    } else if (!email.endsWith('@utm.my') && !email.endsWith('@graduate.utm.my')) {
      errs.email = 'Must be a UTM email (@utm.my or @graduate.utm.my)';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};:'",./<>?\\|`~]/.test(password)) {
      errs.password = 'Password must contain at least one special character';
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  }, [fullName, email, password, confirmPassword]);

  // Password strength indicator
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};:'",./<>?\\|`~]/.test(password)) strength++;
    return strength;
  }, [password]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'][passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields as touched to show errors
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

    if (Object.keys(errors).length > 0) {
      // Show the first error as a toast as well
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    setLoading(true);
    try {
      const result = await register({ fullName: fullName.trim(), email, password });
      // Always auto-login — email verification is not used
      storeLogin(result.user);
      toast.success('Account created!', { description: `Welcome to CatCare UTM, ${result.user.fullName}` });
      router.push('/dashboard');
    } catch (err) {
      toast.error('Registration failed', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return touched[field] ? errors[field] : undefined;
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
            Create your account
          </p>
        </div>

        <Card className="rounded-2xl shadow-xl border-amber-100/80 backdrop-blur-sm bg-white/80">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Register</CardTitle>
            <CardDescription>Join CatCare to help manage campus cats</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name (e.g. Ahmad Ali)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                    className={cn('pl-10', getFieldError('fullName') && 'border-red-400 focus-visible:ring-red-400')}
                    disabled={loading}
                  />
                  {touched.fullName && !errors.fullName && fullName.trim() && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {getFieldError('fullName') && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {getFieldError('fullName')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="your.email@utm.my"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    className={cn('pl-10', getFieldError('email') && 'border-red-400 focus-visible:ring-red-400')}
                    disabled={loading}
                  />
                  {touched.email && !errors.email && email && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {getFieldError('email') && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {getFieldError('email')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters + special char"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    className={cn('pl-10 pr-10', getFieldError('password') && 'border-red-400 focus-visible:ring-red-400')}
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
                {/* Password strength bar */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-colors',
                            passwordStrength >= level ? strengthColor : 'bg-gray-200 dark:bg-gray-700'
                          )}
                        />
                      ))}
                    </div>
                    <p className={cn(
                      'text-[10px]',
                      passwordStrength <= 1 ? 'text-red-500' :
                      passwordStrength <= 2 ? 'text-orange-500' :
                      passwordStrength <= 3 ? 'text-yellow-600' :
                      'text-emerald-600'
                    )}>
                      {strengthLabel}
                    </p>
                  </div>
                )}
                {getFieldError('password') && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {getFieldError('password')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                    className={cn('pl-10', getFieldError('confirmPassword') && 'border-red-400 focus-visible:ring-red-400')}
                    disabled={loading}
                  />
                  {touched.confirmPassword && !errors.confirmPassword && confirmPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {getFieldError('confirmPassword') && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {getFieldError('confirmPassword')}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
