'use client';

import BidsManagement from '@/src/components/admin/BidsManagement';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function BidsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'MOD']}>
      <BidsManagement />
    </ProtectedRoute>
  );
}


