'use client';

import { DisputesCenter } from '@/src/components/disputes/DisputesCenter';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function DisputesPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'SUPPORT']}>
      <DisputesCenter />
    </ProtectedRoute>
  );
}
