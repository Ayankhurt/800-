import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { notificationsService, Notification } from '@/src/lib/api/notificationsService';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        loadUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (open) {
            loadNotifications();
        }
    }, [open]);

    const loadUnreadCount = async () => {
        try {
            const response = await notificationsService.getUnreadCount();
            if (response.success) {
                setUnreadCount(response.data.unread);
            }
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationsService.getUserNotifications({ limit: 10 });
            if (response.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unread || 0);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationsService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            toast.success('Marked as read');
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationsService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'warning':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'error':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 md:w-96 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={`${getNotificationColor(notification.type)} text-xs`}>
                                                    {notification.type}
                                                </Badge>
                                                {!notification.is_read && (
                                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                                )}
                                            </div>
                                            <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
                                            <p className="text-sm text-gray-600 line-clamp-2">{notification.content}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            {!notification.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                                onClick={(e) => handleDelete(notification.id, e)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="p-3 border-t bg-gray-50">
                        <Button variant="ghost" className="w-full text-sm" onClick={() => setOpen(false)}>
                            View all notifications
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
