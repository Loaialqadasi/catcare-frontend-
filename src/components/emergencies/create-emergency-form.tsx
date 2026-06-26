'use client';

// Youssef Mostafa — CCU-S1-03 | Emergency Reports Module

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createEmergency, fetchCats } from '@/lib/api-client';
import { toast } from 'sonner';
import type { EmergencyType, Priority, Cat } from '@/lib/types';

import { useEffect } from 'react';

export function CreateEmergencyForm() {
  const [catId, setCatId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('injury');
  const [priority, setPriority] = useState<Priority>('medium');
  const [locationName, setLocationName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Apply preselected cat ID from URL query param
  useEffect(() => {
    const preselectedCatId = searchParams.get('catId');
    if (preselectedCatId) {
      setCatId(preselectedCatId);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadCats() {
      try {
        const res = await fetchCats({ pageSize: 100 });
        setCats(res.items);
      } catch {
        setCats([]);
      }
    }
    loadCats();
  }, []);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Please enter a title for the emergency');
      return false;
    }
    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return false;
    }
    if (!description.trim()) {
      toast.error('Please describe the emergency');
      return false;
    }
    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return false;
    }
    if (!locationName.trim()) {
      toast.error('Please enter the location');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const newEmergency = await createEmergency(
        {
          catId: catId && catId !== 'none' ? catId : undefined,
          title: title.trim(),
          description: description.trim(),
          emergencyType,
          priority,
          locationName: locationName.trim(),
          latitude: 1.5595,
          longitude: 103.6388,
        }
      );
      toast.success('Emergency reported!', { description: 'Your report has been submitted successfully' });
      router.push(`/emergencies/${newEmergency.id}`);
    } catch (err) {
      toast.error('Failed to submit report', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in-up">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/emergencies')}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>

      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">Report Emergency</CardTitle>
          <CardDescription>
            Submit a new emergency report for a campus cat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Related Cat */}
            <div className="space-y-2">
              <Label>Related Cat (Optional)</Label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a cat if known" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific cat</SelectItem>
                  {cats.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nickname} — {cat.locationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the emergency"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="emg-description">Description *</Label>
              <Textarea
                id="emg-description"
                placeholder="Provide detailed information about the emergency situation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                disabled={submitting}
              />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emergency Type</Label>
                <Select value={emergencyType} onValueChange={(v) => setEmergencyType(v as EmergencyType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="injury">🩹 Injury</SelectItem>
                    <SelectItem value="sickness">🤒 Sickness</SelectItem>
                    <SelectItem value="missing">🔍 Missing</SelectItem>
                    <SelectItem value="feeding_urgent">🍽️ Feeding Urgent</SelectItem>
                    <SelectItem value="danger">⚠️ Danger</SelectItem>
                    <SelectItem value="other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="critical">🔴 Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="emg-location">Location Name *</Label>
              <Input
                id="emg-location"
                placeholder="e.g., Engineering Faculty, Block E"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/emergencies')}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Submit Report
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
