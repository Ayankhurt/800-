'use client';

import SystemAdministration from '@/src/components/admin/SystemAdministration';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER']}>
      <SystemAdministration />
    </ProtectedRoute>
  );
}

