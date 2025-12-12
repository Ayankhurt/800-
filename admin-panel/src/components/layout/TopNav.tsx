'use client';

import { Search, Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AuthUser } from '@/types';
import { notificationsService } from '@/src/lib/api/notificationsService';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';

interface TopNavProps {
  currentUser: AuthUser;
  onLogout: () => void;
}

const getRoleDisplay = (role: string) => {
  const roleMap = {
    'super_admin': 'Super Admin',
    'admin': 'Admin',
    'finance_manager': 'Finance Manager',
    'moderator': 'Moderator',
    'support_agent': 'Support Agent',
  };
  return roleMap[role as keyof typeof roleMap] || role;
};

// Get time ago
const getTimeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export function TopNav({ currentUser, onLogout }: TopNavProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsService.getUserNotifications({ limit: 10 }),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete notification');
    },
  });

  // Fixed: Access notifications correctly from backend response
  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = unreadCountData?.data?.unread || 0;
  const unreadNotifications = notifications.filter((n: any) => !n.is_read);

  const initials = currentUser?.name
    ? currentUser.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
    : 'U';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-blue-600">Bidroom Admin</h1>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search users, projects, or transactions..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-96">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.slice(0, 10).map((notification: any) => (
                      <div key={notification.id}>
                        <DropdownMenuItem
                          className="flex flex-col items-start p-3 cursor-pointer"
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsReadMutation.mutate(notification.id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                                {notification.title || 'Notification'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content || notification.type}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {getTimeAgo(notification.created_at)}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="h-2 w-2 bg-blue-600 rounded-full ml-2 mt-1" />
                            )}
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-center justify-center"
                    onClick={() => {
                      // Mark all as read
                      notifications.forEach((n: any) => {
                        if (!n.is_read) {
                          markAsReadMutation.mutate(n.id);
                        }
                      });
                    }}
                  >
                    Mark all as read
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span>{currentUser?.name || 'User'}</span>
                  <span className="text-gray-500">{getRoleDisplay(currentUser?.role || 'admin')}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  const refreshToken =
                    typeof window !== 'undefined'
                      ? localStorage.getItem('refresh_token')
                      : null;
                  if (refreshToken) {
                    try {
                      const { authService } = await import('@/src/lib/api/authService');
                      await authService.logout(refreshToken);
                    } catch (error) {
                      // Ignore errors - proceed with logout anyway
                    }
                  }
                  // Clear storage and call onLogout
                  if (typeof window !== 'undefined') {
                    localStorage.clear();
                  }
                  onLogout();
                }}
                className="text-red-600"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
