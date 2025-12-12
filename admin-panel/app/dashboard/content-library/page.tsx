'use client';

import ContentLibrary from '@/src/components/admin/ContentLibrary';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function ContentLibraryPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'MOD']}>
      <ContentLibrary />
    </ProtectedRoute>
  );
}


