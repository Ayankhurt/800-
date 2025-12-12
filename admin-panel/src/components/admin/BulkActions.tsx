'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Download,
  Send,
  ShieldOff,
  MoreVertical,
  FileDown,
} from 'lucide-react';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedUsers: string[];
  onActionComplete: () => void;
}

export function BulkActions({ selectedUsers, onActionComplete }: BulkActionsProps) {
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const hasSelection = selectedUsers.length > 0;

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const blob = await adminService.exportUsers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Users exported successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to export users');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.bulkAction('suspend', selectedUsers, {
        reason: suspendReason,
      });
      if (response.success) {
        toast.success(`${selectedUsers.length} users suspended`);
        setShowSuspendDialog(false);
        setSuspendReason('');
        onActionComplete();
      } else {
        toast.error(response.message || 'Failed to suspend users');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to suspend users');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkNotify = async () => {
    if (!notificationMessage.trim()) {
      toast.error('Please enter a notification message');
      return;
    }

    try {
      setLoading(true);
      const promises = selectedUsers.map((userId) =>
        adminService.sendNotification(userId, notificationMessage)
      );
      await Promise.all(promises);
      toast.success(`Notification sent to ${selectedUsers.length} users`);
      setShowNotifyDialog(false);
      setNotificationMessage('');
      onActionComplete();
    } catch (error: any) {
      toast.error('Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={!hasSelection}
            className="w-full sm:w-auto"
          >
            <MoreVertical className="h-4 w-4 mr-2" />
            Bulk Actions ({selectedUsers.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportCSV} disabled={loading}>
            <FileDown className="h-4 w-4 mr-2" />
            Export Selected to CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowNotifyDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowSuspendDialog(true)}
            className="text-red-600"
          >
            <ShieldOff className="h-4 w-4 mr-2" />
            Mass Suspend (Emergency)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mass Suspend Users</DialogTitle>
            <DialogDescription>
              You are about to suspend {selectedUsers.length} users. This action
              requires a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Reason *</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Enter reason for mass suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendDialog(false);
                setSuspendReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSuspend}
              disabled={loading || !suspendReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Suspending...' : `Suspend ${selectedUsers.length} Users`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notify Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a notification to {selectedUsers.length} selected users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notification-message">Message *</Label>
              <Textarea
                id="notification-message"
                placeholder="Enter notification message..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNotifyDialog(false);
                setNotificationMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkNotify}
              disabled={loading || !notificationMessage.trim()}
            >
              {loading ? 'Sending...' : `Send to ${selectedUsers.length} Users`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


