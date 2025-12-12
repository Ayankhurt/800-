'use client';

import UsersManagement from '@/src/components/admin/UsersManagement';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <UsersManagement />
    </ProtectedRoute>
  );
}

