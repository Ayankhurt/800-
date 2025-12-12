'use client';

import JobsManagement from '@/src/components/admin/JobsManagement';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function JobsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'MOD']}>
      <JobsManagement />
    </ProtectedRoute>
  );
}


