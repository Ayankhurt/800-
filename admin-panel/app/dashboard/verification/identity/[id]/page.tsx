'use client';

import { use } from 'react';
import IdentityVerificationComponent from '@/src/components/admin/IdentityVerification';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function IdentityVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'MOD']}>
      <IdentityVerificationComponent verificationId={id} />
    </ProtectedRoute>
  );
}

