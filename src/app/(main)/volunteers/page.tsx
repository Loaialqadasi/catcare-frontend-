'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HandHeart, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { createVolunteer, fetchMyVolunteerings } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Volunteer, VolunteerStatus } from '@/lib/types';

const statusConfig: Record<VolunteerStatus, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
  approved: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Approved' },
  rejected: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950/40', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
};

export default function VolunteersPage() {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [age, setAge] = useState('');
  const [faculty, setFaculty] = useState('');
  const [interests, setInterests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyVolunteerings()
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim() || !age || !faculty.trim() || !interests.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    if (studentName.trim().length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }
    if (faculty.trim().length < 2) {
      toast.error('Faculty must be at least 2 characters');
      return;
    }
    if (interests.trim().length < 10) {
      toast.error('Interests must be at least 10 characters — tell us more about why you want to volunteer!');
      return;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
      toast.error('Age must be between 16 and 100');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createVolunteer({
        studentName: studentName.trim(),
        studentId: studentId.trim(),
        age: ageNum,
        faculty: faculty.trim(),
        interests: interests.trim(),
      });
      setApplications((prev) => [result, ...prev]);
      setStudentName('');
      setStudentId('');
      setAge('');
      setFaculty('');
      setInterests('');
      toast.success('Volunteer application submitted!');
    } catch (err) {
      if (err instanceof Error) {
        // Show more specific error messages from the API
        const msg = err.message;
        if (msg === 'SESSION_EXPIRED') return; // already handled by apiFetch
        if (msg === 'CSRF_TOKEN_EXPIRED') return; // already handled by apiFetch
        toast.error(msg);
      } else {
        toast.error('Failed to submit application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Volunteers</h1>
      <p className="text-muted-foreground">Apply to volunteer for campus cat care at UTM</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HandHeart className="h-5 w-5 text-amber-500" />
              Volunteer Application
            </CardTitle>
            <CardDescription>Fill in your details to apply as a campus cat care volunteer</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Full Name *</Label>
                  <Input id="studentName" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Your full name" disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g., A22CS001" disabled={submitting} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input id="age" type="number" min="16" max="100" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 21" disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculty *</Label>
                  <Input id="faculty" value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="e.g., FC - Computing" disabled={submitting} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interests">Interests *</Label>
                <Textarea id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="What motivates you to volunteer? Any relevant experience with animals?" rows={4} disabled={submitting} />
                <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Submitting...</span> : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">My Applications</CardTitle>
            <CardDescription>Your volunteer application history</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <HandHeart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No applications yet. Fill in the form to get started!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {applications.map((app) => {
                  const config = statusConfig[app.status];
                  return (
                    <div key={app.id} className="p-3 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{app.studentName}</span>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 font-medium ${config.bgColor} ${config.color} flex items-center gap-1`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">ID: {app.studentId} | FC: {app.faculty} | Age: {app.age}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{app.interests}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
