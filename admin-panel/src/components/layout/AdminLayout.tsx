'use client';

import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { AuthUser, PageType } from '@/types';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export function AdminLayout({ children, currentUser, onLogout }: AdminLayoutProps) {
  if (!currentUser) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav currentUser={currentUser} onLogout={onLogout} />
      <div className="relative">
        <Sidebar currentUser={currentUser} />
        <div className="pl-64 w-full">
          <main className="p-8 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}