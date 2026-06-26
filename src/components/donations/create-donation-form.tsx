'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, ArrowLeft, Upload, Loader2, X, QrCode } from 'lucide-react';
import { createDonation } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';

export function CreateDonationForm() {
  const { user } = useAppStore();
  const router = useRouter();
  const [donorName, setDonorName] = useState(user?.fullName || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, WebP, or PDF files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 5 MB.');
      return;
    }
    setReceipt(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const clearReceipt = () => {
    setReceipt(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = (): string | null => {
    if (!donorName.trim()) return 'Please enter your name';
    if (donorName.trim().length < 2) return 'Name must be at least 2 characters';
    if (!donorEmail.trim()) return 'Please enter your email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) return 'Please enter a valid email';
    if (!amount || Number(amount) <= 0) return 'Please enter a valid donation amount';
    if (Number(amount) > 1000000) return 'Amount cannot exceed RM 1,000,000';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) { toast.error(error); return; }

    setSubmitting(true);
    setUploadProgress(0);
    try {
      // Simulate upload progress since fetch doesn't support progress events
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + Math.random() * 15;
        });
      }, 300);

      await createDonation({
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        amount: Number(amount),
        note: note.trim() || undefined,
        receipt: receipt ?? undefined,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('Donation submitted successfully!');
      router.push('/donations');
    } catch (err: any) {
      setUploadProgress(0);
      toast.error(err.message || 'Failed to submit donation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => router.push('/donations')} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>

      {/* QR Code Payment Section */}
      <Card className="rounded-xl border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <QrCode className="h-5 w-5 text-amber-500" />
            Scan to Pay
          </CardTitle>
          <CardDescription>Scan the QR code below to make your bank transfer, then upload the receipt</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <Image
              src="/Loai-qr.png"
              alt="Bank Payment QR Code"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Use your banking app to scan this QR code and transfer your donation amount.<br />
            After payment, upload the receipt below.
          </p>
        </CardContent>
      </Card>

      {/* Donation Form */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-amber-500" />
            Make a Donation
          </CardTitle>
          <p className="text-sm text-muted-foreground">Your contribution helps care for campus cats at UTM.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donorName">Full Name *</Label>
                <Input id="donorName" value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Your full name" disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donorEmail">Email *</Label>
                <Input id="donorEmail" type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="your.name@utm.my" disabled={submitting} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Donation Amount (RM) *</Label>
              <Input id="amount" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50" disabled={submitting} />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label>Upload Receipt</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleReceiptChange}
                className="hidden"
                disabled={submitting}
              />
              {receiptPreview ? (
                <div className="relative inline-block">
                  <img src={receiptPreview} alt="Receipt preview" className="h-32 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={clearReceipt}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    disabled={submitting}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">{receipt?.name}</p>
                </div>
              ) : receipt ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                  <span className="text-sm">{receipt.name}</span>
                  <button type="button" onClick={clearReceipt} className="text-destructive hover:text-destructive/80">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 h-20 w-full rounded-lg border-2 border-dashed border-border hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                  disabled={submitting}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload payment receipt</span>
                </button>
              )}
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or PDF — max 5 MB</p>
              {submitting && receipt && (
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground mb-1">Uploading receipt...</p>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any message or note about your donation..." maxLength={500} rows={3} disabled={submitting} />
              <p className="text-xs text-muted-foreground">{note.length}/500 characters</p>
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
              {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Submitting...</span> : 'Submit Donation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
