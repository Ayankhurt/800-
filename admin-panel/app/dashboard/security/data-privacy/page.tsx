'use client';

import DataPrivacy from '@/src/components/admin/DataPrivacy';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function DataPrivacyPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <DataPrivacy />
    </ProtectedRoute>
  );
}


