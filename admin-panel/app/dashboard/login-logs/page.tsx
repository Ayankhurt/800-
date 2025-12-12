'use client';

import LoginLogs from '@/src/components/admin/LoginLogs';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function LoginLogsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <LoginLogs />
    </ProtectedRoute>
  );
}

