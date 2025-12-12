'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FinanceEscrow } from '@/src/components/finance/FinanceEscrow';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

function FinanceContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'escrow';
  
  return <FinanceEscrow defaultTab={tab} />;
}

export default function FinancePage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'FIN']}>
      <Suspense fallback={<div>Loading...</div>}>
        <FinanceContent />
      </Suspense>
    </ProtectedRoute>
  );
}
