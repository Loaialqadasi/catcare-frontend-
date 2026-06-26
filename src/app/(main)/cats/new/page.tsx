'use client';

import { Suspense } from 'react';
import { CreateCatForm } from '@/components/cats/create-cat-form';

export default function CreateCatPage() {
  return (
    <Suspense fallback={null}>
      <CreateCatForm />
    </Suspense>
  );
}
