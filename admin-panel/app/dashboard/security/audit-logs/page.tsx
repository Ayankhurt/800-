'use client';

import AuditLogs from '@/src/components/admin/AuditLogs';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function AuditLogsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <AuditLogs />
    </ProtectedRoute>
  );
}


