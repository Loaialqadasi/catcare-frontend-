'use client';

import React from 'react';
import { DonationDetail } from '@/components/donations/donation-detail';

export default function DonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <DonationDetail donationId={id} />;
}
