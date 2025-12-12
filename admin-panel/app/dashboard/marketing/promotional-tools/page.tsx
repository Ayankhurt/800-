'use client';

import PromotionalTools from '@/src/components/admin/PromotionalTools';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function PromotionalToolsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <PromotionalTools />
    </ProtectedRoute>
  );
}


