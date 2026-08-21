'use client';

import { use } from 'react';
import { BdsPostWizard } from '@/components/bds-post-wizard/BdsPostWizard';

export default function BdsEditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <BdsPostWizard propertyId={Number(id)} />;
}
