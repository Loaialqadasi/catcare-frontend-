'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Cat, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { forgotPassword, resetPassword } from '@/lib/api-client';
import { validatePassword, validatePasswordMatch } from '@/lib/validators';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: Enter email
  const [email, setEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Step 2: Set new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1: Submit email to get a reset token
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!email.endsWith('@utm.my') && !email.endsWith('@graduate.utm.my')) {
      toast.error('Please use a valid UTM email (e.g. your.name@utm.my)');
      return;
    }

    setLoadingEmail(true);
    try {
      const data = await forgotPassword(email.trim());
      if (data?.token) {
        // Token returned directly — show the reset password form immediately
        setResetToken(data.token);
      } else {
        // Fallback: token not returned (shouldn't happen, but handle gracefully)
        toast.success('If your email is registered, a password reset link has been sent. Please check your email.');
        setSuccess(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoadingEmail(false);
    }
  };

  // Step 2: Submit new password with the reset token
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      toast.error('No reset token found. Please try again.');
      return;
    }

    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.valid) {
      toast.error(pwdValidation.error!);
      return;
    }

    const matchValidation = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchValidation.valid) {
      toast.error(matchValidation.error!);
      return;
    }

    setLoadingReset(true);
    try {
      await resetPassword(resetToken, newPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error('Failed to reset password', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setLoadingReset(false);
    }
  };

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
          <p className="text-muted-foreground mt-1">Reset Your Password</p>
        </div>

        <Card className="rounded-2xl shadow-xl border-amber-100/80 backdrop-blur-sm bg-white/80">
          {success ? (
            <>
              <CardContent className="py-8 text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                <h2 className="text-xl font-semibold text-foreground">Password Reset!</h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg"
                >
                  Sign In
                </Button>
              </CardContent>
            </>
          ) : resetToken ? (
            /* Step 2: Enter new password */
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Set New Password</CardTitle>
                <CardDescription>Enter your new password for {email}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters + special char"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={loadingReset}
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
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmNewPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        disabled={loadingReset}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg"
                    disabled={loadingReset}
                  >
                    {loadingReset ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Resetting...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            /* Step 1: Enter email */
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Forgot Your Password?</CardTitle>
                <CardDescription>
                  Enter your UTM email address to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">UTM Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="your.email@utm.my"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={loadingEmail}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use your UTM email address (@utm.my or @graduate.utm.my)
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg"
                    disabled={loadingEmail}
                  >
                    {loadingEmail ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Checking...
                      </span>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {!success && (
            <div className="px-6 pb-6">
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
