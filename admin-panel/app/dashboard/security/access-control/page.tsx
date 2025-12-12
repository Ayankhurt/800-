'use client';

import AccessControl from '@/src/components/admin/AccessControl';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function AccessControlPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER']}>
      <AccessControl />
    </ProtectedRoute>
  );
}


