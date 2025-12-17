'use client';

import { Suspense } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  Scale,
  Shield,
  Headphones,
  Settings,
  ChevronRight,
  FileText,
  CreditCard,
  BarChart3,
  Flag,
  MessageSquare,
  HelpCircle,
  UserCog,
  Hammer,
  TrendingUp,
  Wallet,
  Receipt,
  AlertTriangle,
  Bell,
  Mail,
  Megaphone,
  CheckCircle2,
  BookOpen,
  Eye,
  Search,
  FolderKanban,
  Lock,
  FileCheck,
  Database,
  Gauge,
  Gift,
  Star,
  Globe,
  BarChart,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { AuthUser, PageType } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button'; // Need button for close icon

interface MenuItem {
  id: PageType;
  label: string;
  icon: React.ReactNode;
  allowedRoles: string[];
  adminOnly?: boolean;
}

interface SidebarProps {
  currentUser: AuthUser | null;
  isOpen?: boolean;
  onClose?: () => void;
}

// Inner component that uses useSearchParams (requires Suspense)
function SidebarContent({ currentUser, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!currentUser) {
    return null;
  }

  // Get current active tab from query params
  const currentTab = searchParams?.get('tab') || '';

  // Route mapping for Next.js
  const getRoute = (pageId: PageType): string => {
    const routeMap: Record<PageType, string> = {
      'dashboard': '/dashboard',
      'users': '/dashboard/users',
      'manage-admins': '/dashboard/manage-admins',
      'projects': '/dashboard/projects',
      'jobs': '/dashboard/jobs',
      'bids': '/dashboard/bids',
      'disputes': '/dashboard/disputes',
      'payments': '/dashboard/financial/payments',
      'transactions': '/dashboard/financial/transactions',
      'escrow': '/dashboard/financial/escrow',
      'payouts': '/dashboard/financial/payouts',
      'tickets': '/dashboard/support/tickets',
      'verification': '/dashboard/verification',
      'moderation': '/dashboard/moderation',
      'audit-logs': '/dashboard/audit-logs',
      'settings': '/dashboard/settings',
    };
    return routeMap[pageId] || '/dashboard';
  };

  // Define all menu items with role-based permissions
  const menuItems: MenuItem[] = [
    // Dashboard
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin', 'finance_manager', 'moderator', 'support_agent'],
      adminOnly: false,
    },

    // User Management
    {
      id: 'manage-admins',
      label: 'Manage Admins',
      icon: <UserCog className="h-5 w-5" />,
      allowedRoles: ['super_admin'],
      adminOnly: true,
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin'],
      adminOnly: false,
    },

    // Projects & Jobs
    {
      id: 'projects',
      label: 'Projects',
      icon: <Briefcase className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin'],
      adminOnly: false,
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: <Hammer className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin'],
      adminOnly: false,
    },
    {
      id: 'bids',
      label: 'Bids',
      icon: <FileText className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin'],
      adminOnly: false,
    },

    // Financial Management

    {
      id: 'transactions',
      label: 'Transactions',
      icon: <Receipt className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'finance_manager'],
      adminOnly: false,
    },
    {
      id: 'escrow',
      label: 'Escrow',
      icon: <Wallet className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'finance_manager'],
      adminOnly: false,
    },
    {
      id: 'payouts',
      label: 'Payouts',
      icon: <CreditCard className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'finance_manager'],
      adminOnly: false,
    },
    // Removed: Reports & Fraud (Not fully implemented)

    // Disputes
    {
      id: 'disputes',
      label: 'Disputes',
      icon: <Scale className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin'],
      adminOnly: false,
    },

    // Support
    {
      id: 'tickets',
      label: 'Tickets',
      icon: <MessageSquare className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin', 'support_agent'],
      adminOnly: false,
    },

    // Communication & Content
    // Communication & Content - Disabled for Core MVP
    /*
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin', 'moderator'],
      adminOnly: false,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin'],
      adminOnly: false,
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: <Megaphone className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin'],
      adminOnly: false,
    },
    */

    // Moderation
    {
      id: 'verification',
      label: 'Verification',
      icon: <CheckCircle2 className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin'],
      adminOnly: false,
    },
    {
      id: 'moderation',
      label: 'Moderation Reports',
      icon: <Shield className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin', 'moderator'],
      adminOnly: false,
    },

    // Settings & Security
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: <FileCheck className="h-5 w-5" />,
      allowedRoles: ['super_admin', 'admin'],
      adminOnly: false,
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: <Settings className="h-5 w-5" />,
      allowedRoles: ['super_admin'],
      adminOnly: true,
    },
  ];

  // Filter menu items based on current user's role
  const visibleItems = menuItems.filter(item => {
    if (!currentUser || !currentUser.role) return false;

    // Role-based filtering
    const hasRoleAccess = item.allowedRoles.includes(currentUser.role);

    // Admin-only filtering (SUPER has access to everything)
    if (item.adminOnly && currentUser.role !== 'super_admin') {
      return false;
    }

    return hasRoleAccess;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "bg-white border-r border-gray-200 fixed top-0 bottom-0 overflow-y-auto z-50 transition-transform duration-300 ease-in-out",
        "w-64 lg:top-16 lg:left-0", // Desktop fixed positioning
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", // Mobile toggle logic
        "lg:block" // Always show on desktop
      )}>
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-bold text-lg text-blue-600">Admin Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {visibleItems.map((item) => {
            // Determine active state based on exact pathname and tab match
            let isActive = false;

            // Exact pathname matches for non-tabbed routes
            if (item.id === 'dashboard' && pathname === '/dashboard') {
              isActive = true;
            } else if (item.id === 'users' && pathname.startsWith('/dashboard/users')) {
              isActive = true;
            } else if (item.id === 'manage-admins' && pathname === '/dashboard/manage-admins') {
              isActive = true;
            } else if (item.id === 'projects' && pathname.startsWith('/dashboard/projects')) {
              isActive = true;
            } else if (item.id === 'jobs' && pathname.startsWith('/dashboard/jobs')) {
              isActive = true;
            } else if (item.id === 'bids' && pathname.startsWith('/dashboard/bids')) {
              isActive = true;
            } else if (item.id === 'disputes' && pathname.startsWith('/dashboard/disputes')) {
              isActive = true;
            } else if (item.id === 'settings' && pathname.startsWith('/dashboard/settings')) {
              isActive = true;
            } else if (item.id === 'verification' && pathname.startsWith('/dashboard/verification')) {
              isActive = true;
            } else if (item.id === 'moderation' && pathname.startsWith('/dashboard/moderation')) {
              isActive = true;
            } else if (item.id === 'audit-logs' && pathname.startsWith('/dashboard/audit-logs')) {
              isActive = true;
            }
            // Financial Management routes
            else if (item.id === 'payments' && pathname === '/dashboard/financial/payments') {
              isActive = true;
            } else if (item.id === 'transactions' && pathname.startsWith('/dashboard/financial/transactions')) {
              isActive = true;
            } else if (item.id === 'escrow' && pathname.startsWith('/dashboard/financial/escrow')) {
              isActive = true;
            } else if (item.id === 'payouts' && pathname === '/dashboard/financial/payouts') {
              isActive = true;
            }
            // Support & Help Desk routes
            else if (item.id === 'support' && pathname === '/dashboard/support') {
              isActive = true;
            } else if (item.id === 'tickets' && pathname.startsWith('/dashboard/support/tickets')) {
              isActive = true;
            }

            return (
              <Link
                key={item.id}
                href={getRoute(item.id)}
                onClick={() => onClose?.()} // Close sidebar on mobile when link clicked
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

// Export wrapper with Suspense for useSearchParams
export function Sidebar(props: SidebarProps) {
  if (!props.currentUser) {
    return null;
  }
  return (
    <Suspense fallback={
      <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 hidden lg:block">
        <nav className="p-4 space-y-1">
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </nav>
      </aside>
    }>
      <SidebarContent {...props} />
    </Suspense>
  );
}
