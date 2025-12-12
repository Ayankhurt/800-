'use client';

import { AuthProvider } from '@/src/contexts/AuthContext';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { Toaster } from 'sonner';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}


