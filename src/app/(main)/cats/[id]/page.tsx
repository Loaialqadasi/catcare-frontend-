'use client';

import React from 'react';
import { CatDetail } from '@/components/cats/cat-detail';

export default function CatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <CatDetail catId={id} />;
}
