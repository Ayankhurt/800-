'use client';

import AdminUserManagement from '@/src/components/admin/AdminUserManagement';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function ManageAdminsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER']}>
      <AdminUserManagement />
    </ProtectedRoute>
  );
}
