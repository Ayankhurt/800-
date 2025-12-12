'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { adminService, SupportTicket, CannedResponse } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ArrowLeft,
  RefreshCw,
  Send,
  FileText,
  User,
  Calendar,
  MessageSquare,
  Edit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface TicketDetailViewProps {
  ticketId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function TicketDetailView({
  ticketId,
  onBack,
  onUpdate,
}: TicketDetailViewProps) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalReply, setIsInternalReply] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedCannedResponse, setSelectedCannedResponse] = useState('');

  useEffect(() => {
    loadTicket();
    loadCannedResponses();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSupportTicketDetails(ticketId);
      if (response.success) {
        setTicket(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const loadCannedResponses = async () => {
    try {
      const response = await adminService.getCannedResponses();
      if (response.success) {
        setCannedResponses(response.data.responses || []);
      }
    } catch (error: any) {
      // Silently fail for canned responses
    }
  };

  const handleReply = async () => {
    if (!ticket || !replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const response = await adminService.replyToTicket(ticket.id, {
        message: replyMessage,
        is_internal: isInternalReply,
      });
      if (response.success) {
        toast.success('Reply sent');
        setShowReplyDialog(false);
        setReplyMessage('');
        setIsInternalReply(false);
        loadTicket();
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to send reply');
    }
  };

  const handleAddNote = async () => {
    if (!ticket || !noteText.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const response = await adminService.addTicketNote(ticket.id, noteText);
      if (response.success) {
        toast.success('Note added');
        setShowNoteDialog(false);
        setNoteText('');
        loadTicket();
      }
    } catch (error: any) {
      toast.error('Failed to add note');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    try {
      const response = await adminService.updateSupportTicket(ticket.id, { status: newStatus });
      if (response.success) {
        toast.success('Status updated');
        loadTicket();
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;

    try {
      const response = await adminService.updateSupportTicket(ticket.id, { priority: newPriority });
      if (response.success) {
        toast.success('Priority updated');
        loadTicket();
      }
    } catch (error: any) {
      toast.error('Failed to update priority');
    }
  };

  const handleClose = async () => {
    if (!ticket) return;

    const resolution = prompt('Enter resolution (optional):');
    try {
      const response = await adminService.closeTicket(ticket.id, resolution || undefined);
      if (response.success) {
        toast.success('Ticket closed');
        loadTicket();
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to close ticket');
    }
  };

  const handleReopen = async () => {
    if (!ticket) return;

    const reason = prompt('Enter reason for reopening:');
    if (!reason) return;

    try {
      const response = await adminService.reopenTicket(ticket.id, reason);
      if (response.success) {
        toast.success('Ticket reopened');
        loadTicket();
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to reopen ticket');
    }
  };

  const insertCannedResponse = () => {
    const response = cannedResponses.find((r) => r.id === selectedCannedResponse);
    if (response) {
      setReplyMessage(response.content);
      setSelectedCannedResponse('');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      open: { label: 'Open', className: 'bg-blue-500' },
      in_progress: { label: 'In Progress', className: 'bg-yellow-500' },
      resolved: { label: 'Resolved', className: 'bg-green-500' },
      closed: { label: 'Closed', className: 'bg-gray-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      low: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
      normal: { label: 'Normal', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority] || { label: priority, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Ticket not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Ticket #{ticket.ticket_number}</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">{ticket.subject}</p>
        </div>
        <Button variant="outline" onClick={loadTicket}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Ticket Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status & Priority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              {getStatusBadge(ticket.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Priority</span>
              {getPriorityBadge(ticket.priority)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Category</span>
              <span className="text-sm font-medium capitalize">{ticket.category}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-semibold">{ticket.user.full_name}</p>
                <p className="text-sm text-gray-500">{ticket.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Created: {format(new Date(ticket.created_at), 'PPpp')}</span>
            </div>
            {ticket.first_response_at && (
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <span>First response: {format(new Date(ticket.first_response_at), 'PPpp')}</span>
              </div>
            )}
            {ticket.resolved_at && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-gray-400" />
                <span>Resolved: {format(new Date(ticket.resolved_at), 'PPpp')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowReplyDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Reply
            </Button>
            <Button variant="outline" onClick={() => setShowNoteDialog(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Add Note
            </Button>
            <Select
              value={ticket.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={ticket.priority}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            {ticket.status !== 'closed' ? (
              <Button variant="outline" onClick={handleClose}>
                <XCircle className="h-4 w-4 mr-2" />
                Close
              </Button>
            ) : (
              <Button variant="outline" onClick={handleReopen}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Reopen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation & Notes */}
      <Tabs defaultValue="conversation" className="w-full">
        <TabsList>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="notes">Internal Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="conversation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.conversation_history && ticket.conversation_history.length > 0 ? (
                <div className="space-y-4">
                  {ticket.conversation_history.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.is_internal
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">
                            {message.sender.type === 'user'
                              ? message.sender.user.full_name
                              : message.sender.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(message.created_at), 'PPpp')}
                            {message.is_internal && (
                              <Badge className="ml-2 bg-yellow-500">Internal</Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No conversation history</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.internal_notes && ticket.internal_notes.length > 0 ? (
                <div className="space-y-4">
                  {ticket.internal_notes.map((note) => (
                    <div key={note.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{note.created_by.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(note.created_at), 'PPpp')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No internal notes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Ticket</DialogTitle>
            <DialogDescription>
              Send a reply to {ticket.user.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {cannedResponses.length > 0 && (
              <div className="space-y-2">
                <Label>Canned Response</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedCannedResponse}
                    onValueChange={setSelectedCannedResponse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select canned response" />
                    </SelectTrigger>
                    <SelectContent>
                      {cannedResponses.map((response) => (
                        <SelectItem key={response.id} value={response.id}>
                          {response.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={insertCannedResponse}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Insert
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reply-message">Message *</Label>
              <Textarea
                id="reply-message"
                placeholder="Enter your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={8}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="internal-reply"
                checked={isInternalReply}
                onChange={(e) => setIsInternalReply(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="internal-reply">Internal note (not visible to user)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReplyDialog(false);
                setReplyMessage('');
                setIsInternalReply(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={!replyMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Note</DialogTitle>
            <DialogDescription>
              Add a private note to this ticket
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-text">Note *</Label>
              <Textarea
                id="note-text"
                placeholder="Enter internal note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNoteDialog(false);
                setNoteText('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim()}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


