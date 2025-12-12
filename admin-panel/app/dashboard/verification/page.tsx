'use client';

import VerificationQueue from '@/src/components/admin/VerificationQueue';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function VerificationPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'MOD']}>
      <VerificationQueue />
    </ProtectedRoute>
  );
}


