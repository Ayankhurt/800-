'use client';

import { useState } from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { AuthUser, PageType } from '@/types';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export function AdminLayout({ children, currentUser, onLogout }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav
        currentUser={currentUser}
        onLogout={onLogout}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="relative">
        <Sidebar
          currentUser={currentUser}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-64 w-full transition-all duration-300">
          <main className="p-4 lg:p-8 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}