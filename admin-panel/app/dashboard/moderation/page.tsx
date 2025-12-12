'use client';

import ModerationQueue from '@/src/components/admin/ModerationQueue';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function ModerationPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'MOD']}>
      <ModerationQueue />
    </ProtectedRoute>
  );
}


