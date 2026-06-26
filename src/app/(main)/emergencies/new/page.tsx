'use client';

import { Suspense } from 'react';
import { CreateEmergencyForm } from '@/components/emergencies/create-emergency-form';
import { Skeleton } from '@/components/ui/skeleton';

function CreateEmergencySkeleton() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

export default function CreateEmergencyPage() {
  return (
    <Suspense fallback={<CreateEmergencySkeleton />}>
      <CreateEmergencyForm />
    </Suspense>
  );
}
