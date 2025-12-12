'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Send
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { disputesService } from '@/src/lib/api/disputesService';
import { toast } from 'sonner';
import { useAuth } from '@/src/contexts/AuthContext';

// Format currency
const formatCurrency = (amount: number | undefined) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
};

// Get time ago
const getTimeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
};

export function DisputesCenter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('open');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');

  // Fetch all disputes
  const { data: allDisputesData, isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes-all'],
    queryFn: () => disputesService.getAllDisputes({ limit: 100 }),
  });

  // Fetch selected dispute details
  const { data: disputeDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['dispute-details', selectedDispute],
    queryFn: () => disputesService.getDisputeById(selectedDispute!),
    enabled: !!selectedDispute,
  });

  // Fetch dispute messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['dispute-messages', selectedDispute],
    queryFn: () => disputesService.getDisputeMessages(selectedDispute!),
    enabled: !!selectedDispute,
  });

  // Update dispute status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      disputesService.updateDisputeStatus(id, status),
    onSuccess: () => {
      toast.success('Dispute status updated');
      queryClient.invalidateQueries({ queryKey: ['disputes-all'] });
      queryClient.invalidateQueries({ queryKey: ['dispute-details', selectedDispute] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    },
  });

  // Assign dispute mutation
  const assignDisputeMutation = useMutation({
    mutationFn: ({ id, adminId }: { id: string; adminId: string }) =>
      disputesService.assignDispute(id, adminId),
    onSuccess: () => {
      toast.success('Dispute assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['disputes-all'] });
      queryClient.invalidateQueries({ queryKey: ['dispute-details', selectedDispute] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to assign dispute');
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      disputesService.addDisputeMessage(id, message),
    onSuccess: () => {
      toast.success('Message sent');
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['dispute-messages', selectedDispute] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send message');
    },
  });

  const disputes = allDisputesData?.data?.disputes || [];

  // Filter disputes by search
  const filteredDisputes = disputes.filter((dispute: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dispute.project?.name?.toLowerCase().includes(query) ||
      dispute.complainant?.full_name?.toLowerCase().includes(query) ||
      dispute.respondent?.full_name?.toLowerCase().includes(query) ||
      dispute.category?.toLowerCase().includes(query) ||
      dispute.description?.toLowerCase().includes(query)
    );
  });

  // Filter by tab
  const getFilteredDisputesByTab = () => {
    switch (activeTab) {
      case 'open':
        return filteredDisputes.filter((d: any) => d.status === 'open' || d.status === 'pending');
      case 'investigating':
        return filteredDisputes.filter((d: any) => d.status === 'investigating' || d.status === 'in_progress');
      case 'resolved':
        return filteredDisputes.filter((d: any) => d.status === 'resolved' || d.status === 'closed');
      default:
        return filteredDisputes;
    }
  };

  const openDisputes = filteredDisputes.filter((d: any) => d.status === 'open' || d.status === 'pending');
  const investigatingDisputes = filteredDisputes.filter((d: any) => d.status === 'investigating' || d.status === 'in_progress');
  const resolvedDisputes = filteredDisputes.filter((d: any) => d.status === 'resolved' || d.status === 'closed');

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'pending':
        return <Badge className="bg-red-100 text-red-700">Open</Badge>;
      case 'investigating':
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">Investigating</Badge>;
      case 'resolved':
      case 'closed':
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700">High</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-700">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-700">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedDispute) return;
    addMessageMutation.mutate({ id: selectedDispute, message: messageText });
  };

  const DisputeTable = ({ data }: { data: any[] }) => {
    if (disputesLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Parties</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No disputes found
              </TableCell>
            </TableRow>
          ) : (
            data.map((dispute: any) => (
              <TableRow
                key={dispute.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedDispute(dispute.id)}
              >
                <TableCell>
                  <div className="font-medium">{dispute.project?.name || 'N/A'}</div>
                </TableCell>
                <TableCell>
                  <div className="text-gray-900">{dispute.complainant?.full_name || 'N/A'}</div>
                  <div className="text-gray-500 text-sm">vs {dispute.respondent?.full_name || 'N/A'}</div>
                </TableCell>
                <TableCell>{dispute.category || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(dispute.amount)}</TableCell>
                <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                <TableCell className="text-gray-600 text-sm">{formatDate(dispute.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedDispute(dispute.id)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        if (user?.id) {
                          assignDisputeMutation.mutate({ id: dispute.id, adminId: user.id });
                        }
                      }}>
                        Assign to Me
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        updateStatusMutation.mutate({ id: dispute.id, status: 'investigating' });
                      }}>
                        Mark as Investigating
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        updateStatusMutation.mutate({ id: dispute.id, status: 'resolved' });
                      }}>
                        Mark as Resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Disputes Center</h2>
          <p className="text-gray-600">Handle user disputes and conflict resolution</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total Disputes</p>
                <p className="mt-1 text-2xl font-semibold">{disputes.length}</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Open Cases</p>
                <p className="mt-1 text-2xl font-semibold">{openDisputes.length}</p>
              </div>
              <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Under Investigation</p>
                <p className="mt-1 text-2xl font-semibold">{investigatingDisputes.length}</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Resolved</p>
                <p className="mt-1 text-2xl font-semibold">{resolvedDisputes.length}</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search disputes by project, parties, or category..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disputes List */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="open">
                Open Cases
                {openDisputes.length > 0 && (
                  <Badge className="ml-2 bg-red-500">{openDisputes.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="investigating">Investigating</TabsTrigger>
              <TabsTrigger value="resolved">Resolved Cases</TabsTrigger>
            </TabsList>

            <TabsContent value="open">
              <Card>
                <CardHeader>
                  <CardTitle>Open Disputes ({openDisputes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <DisputeTable data={openDisputes} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="investigating">
              <Card>
                <CardHeader>
                  <CardTitle>Under Investigation ({investigatingDisputes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <DisputeTable data={investigatingDisputes} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resolved">
              <Card>
                <CardHeader>
                  <CardTitle>Resolved Disputes ({resolvedDisputes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <DisputeTable data={resolvedDisputes} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dispute Details Sidebar */}
        {selectedDispute && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dispute Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDispute(null)}>Close</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {detailsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : disputeDetails?.data ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Project</p>
                      <p className="font-medium">{disputeDetails.data.project?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <div className="mt-1">{getStatusBadge(disputeDetails.data.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-medium">{formatCurrency(disputeDetails.data.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Complainant</p>
                      <p className="font-medium">{disputeDetails.data.complainant?.full_name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{disputeDetails.data.complainant?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Respondent</p>
                      <p className="font-medium">{disputeDetails.data.respondent?.full_name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{disputeDetails.data.respondent?.email}</p>
                    </div>
                    {disputeDetails.data.description && (
                      <div>
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="text-sm">{disputeDetails.data.description}</p>
                      </div>
                    )}

                    {/* Messages Thread */}
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">Messages</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {messagesLoading ? (
                          <Skeleton className="h-16 w-full" />
                        ) : messagesData?.data && messagesData.data.length > 0 ? (
                          messagesData.data.map((message: any) => (
                            <div key={message.id} className="p-2 bg-gray-50 rounded">
                              <p className="text-xs text-gray-600">{message.user?.full_name || 'User'}</p>
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{getTimeAgo(message.created_at)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No messages yet</p>
                        )}
                      </div>

                      {/* Add Message */}
                      <div className="mt-4">
                        <Textarea
                          placeholder="Add a message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={3}
                        />
                        <Button
                          className="mt-2 w-full"
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || addMessageMutation.isPending}
                        >
                          {addMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Send Message
                        </Button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t pt-4 space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (user?.id) {
                            assignDisputeMutation.mutate({ id: selectedDispute, adminId: user.id });
                          }
                        }}
                        disabled={assignDisputeMutation.isPending}
                      >
                        {assignDisputeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          'Assign to Me'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          updateStatusMutation.mutate({ id: selectedDispute, status: 'investigating' });
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark as Investigating
                      </Button>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          updateStatusMutation.mutate({ id: selectedDispute, status: 'resolved' });
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark as Resolved
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">No dispute details available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
