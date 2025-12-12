'use client';

import { useParams, useRouter } from 'next/navigation';
import { TicketDetailView } from '@/src/components/admin/TicketDetailView';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  return (
    <TicketDetailView
      ticketId={ticketId}
      onBack={() => router.push('/dashboard/support/tickets')}
      onUpdate={() => {}}
    />
  );
}


