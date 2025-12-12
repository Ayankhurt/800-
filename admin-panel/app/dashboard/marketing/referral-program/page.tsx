'use client';

import ReferralProgramManagement from '@/src/components/admin/ReferralProgramManagement';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function ReferralProgramPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <ReferralProgramManagement />
    </ProtectedRoute>
  );
}


