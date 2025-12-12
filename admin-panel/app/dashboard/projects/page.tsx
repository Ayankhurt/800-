'use client';

import { ProjectsAndBids } from '@/src/components/projects/ProjectsAndBids';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function ProjectsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <ProjectsAndBids />
    </ProtectedRoute>
  );
}
