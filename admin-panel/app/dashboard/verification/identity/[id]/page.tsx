'use client';

import IdentityVerificationComponent from '@/src/components/admin/IdentityVerification';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function IdentityVerificationPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'MOD']}>
      <IdentityVerificationComponent verificationId={id} />
    </ProtectedRoute>
  );
}
