'use client';

import React from 'react';
import { EmergencyDetail } from '@/components/emergencies/emergency-detail';

export default function EmergencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <EmergencyDetail emergencyId={id} />;
}
