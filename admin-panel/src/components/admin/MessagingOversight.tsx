'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, MessageStats, Message } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
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
  Search,
  Download,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  Trash2,
  Shield,
  Ban,
} from 'lucide-react';
import { format } from 'date-fns';

export default function MessagingOversight() {
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [warningText, setWarningText] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, flaggedResponse] = await Promise.all([
        adminService.getMessageStats(),
        adminService.getFlaggedMessages(),
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (flaggedResponse.success) {
        setMessages(flaggedResponse.data.messages || []);
      }
    } catch (error: any) {
      toast.error('Failed to load messaging data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    try {
      const response = await adminService.searchMessages({
        query: searchQuery,
        limit: 50,
      });
      if (response.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error: any) {
      toast.error('Failed to search messages');
    }
  };

  const handleRemoveMessage = async (message: Message) => {
    if (!confirm('Are you sure you want to remove this message?')) {
      return;
    }

    try {
      const response = await adminService.removeMessage(message.id, 'Inappropriate content');
      if (response.success) {
        toast.success('Message removed');
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to remove message');
    }
  };

  const handleWarn = async () => {
    if (!selectedMessage || !warningText.trim()) {
      toast.error('Please enter a warning message');
      return;
    }

    try {
      const response = await adminService.warnUserForMessage(
        selectedMessage.sender.id,
        selectedMessage.id,
        warningText
      );
      if (response.success) {
        toast.success('Warning sent');
        setShowWarnDialog(false);
        setSelectedMessage(null);
        setWarningText('');
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to send warning');
    }
  };

  const handleBlock = async () => {
    if (!selectedMessage || !blockReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const response = await adminService.blockUserFromMessaging(
        selectedMessage.sender.id,
        blockReason,
        blockDuration ? Number(blockDuration) : undefined
      );
      if (response.success) {
        toast.success('User blocked from messaging');
        setShowBlockDialog(false);
        setSelectedMessage(null);
        setBlockReason('');
        setBlockDuration('');
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to block user');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminService.exportMessages({ format: 'csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `messages-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Messages exported');
    } catch (error: any) {
      toast.error('Failed to export messages');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messaging data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Messaging Oversight</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Monitor and moderate platform messages
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_messages.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_response_time.toFixed(1)}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unread Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.unread_message_rate * 100).toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Flagged Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.flagged_messages_count.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search messages by content, sender, or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Messages Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No messages found
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{message.sender.full_name}</p>
                        <p className="text-sm text-gray-500">{message.sender.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{message.recipient.full_name}</p>
                        <p className="text-sm text-gray-500">{message.recipient.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{message.content}</p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(message.created_at), 'PPpp')}
                    </TableCell>
                    <TableCell>
                      {message.flagged ? (
                        <Badge className="bg-red-500">Flagged</Badge>
                      ) : (
                        <Badge className="bg-gray-500">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message);
                            setShowWarnDialog(true);
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Warn
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message);
                            setShowBlockDialog(true);
                          }}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Block
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMessage(message)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Warn Dialog */}
      <Dialog open={showWarnDialog} onOpenChange={setShowWarnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warn User</DialogTitle>
            <DialogDescription>
              Send a warning to {selectedMessage?.sender.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="warning-text">Warning Message *</Label>
              <Textarea
                id="warning-text"
                placeholder="Enter warning message..."
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowWarnDialog(false);
                setSelectedMessage(null);
                setWarningText('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleWarn} disabled={!warningText.trim()}>
              Send Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User from Messaging</DialogTitle>
            <DialogDescription>
              Block {selectedMessage?.sender.full_name} from sending messages
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="block-reason">Reason *</Label>
              <Textarea
                id="block-reason"
                placeholder="Enter reason for blocking..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-duration">Duration (days, optional)</Label>
              <Input
                id="block-duration"
                type="number"
                placeholder="Leave empty for permanent"
                value={blockDuration}
                onChange={(e) => setBlockDuration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBlockDialog(false);
                setSelectedMessage(null);
                setBlockReason('');
                setBlockDuration('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBlock} disabled={!blockReason.trim()}>
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


