'use client';

import ContractorProfileManagement from '@/src/components/admin/ContractorProfileManagement';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function ContractorProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'MOD']}>
      <ContractorProfileManagement />
    </ProtectedRoute>
  );
}


