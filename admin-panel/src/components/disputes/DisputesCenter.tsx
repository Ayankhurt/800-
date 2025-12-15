'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  Loader2,
  AlertTriangle,
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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Skeleton } from '../ui/skeleton';
import { disputesService } from '@/src/lib/api/disputesService';

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
  const [activeTab, setActiveTab] = useState('open');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [resolutionDetails, setResolutionDetails] = useState({
    resolution: '',
    notes: ''
  });
  const queryClient = useQueryClient();

  // Resolve Dispute Mutation
  const resolveMutation = useMutation({
    mutationFn: (data: any) => disputesService.resolveDispute(selectedDispute!, data),
    onSuccess: () => {
      toast.success('Dispute resolved successfully');
      setIsResolveDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['disputes-all'] });
      queryClient.invalidateQueries({ queryKey: ['dispute', selectedDispute] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute');
    }
  });

  // Close Dispute Mutation
  const closeMutation = useMutation({
    mutationFn: () => disputesService.closeDispute(selectedDispute!),
    onSuccess: () => {
      toast.success('Dispute closed successfully');
      setIsCloseDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['disputes-all'] });
      queryClient.invalidateQueries({ queryKey: ['dispute', selectedDispute] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to close dispute');
    }
  });

  // Fetch all disputes
  const { data: allDisputesData, isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes-all'],
    queryFn: () => disputesService.getAllDisputes({ limit: 100 }),
  });

  // Fetch selected dispute details (Dynamic Fetching)
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['dispute', selectedDispute],
    queryFn: () => disputesService.getDisputeById(selectedDispute!),
    enabled: !!selectedDispute,
  });

  // Get selected dispute data (prefer detailed fetch, fallback to list)
  const disputes = allDisputesData?.data?.disputes || [];
  const selectedDisputeData = detailData?.data;

  // Filter disputes by search
  const filteredDisputes = disputes.filter((dispute: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dispute.project?.title?.toLowerCase().includes(query) ||
      dispute.raised_by_user?.first_name?.toLowerCase().includes(query) ||
      dispute.raised_by_user?.last_name?.toLowerCase().includes(query) ||
      dispute.reason?.toLowerCase().includes(query) ||
      dispute.description?.toLowerCase().includes(query)
    );
  });

  const openDisputes = filteredDisputes.filter((d: any) => d.status === 'open' || d.status === 'pending');
  const investigatingDisputes = filteredDisputes.filter((d: any) => d.status === 'investigating' || d.status === 'in_progress' || d.status === 'under_review');
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
            <TableHead>Raised By</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
                  <div className="font-medium">{dispute.project?.title || 'N/A'}</div>
                </TableCell>
                <TableCell>
                  <div className="text-gray-900">
                    {dispute.raised_by_user
                      ? `${dispute.raised_by_user.first_name || ''} ${dispute.raised_by_user.last_name || ''}`.trim() || 'N/A'
                      : 'N/A'}
                  </div>
                  <div className="text-gray-500 text-sm">{dispute.raised_by_user?.email || ''}</div>
                </TableCell>
                <TableCell>{dispute.reason || 'N/A'}</TableCell>
                <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                <TableCell className="text-gray-600 text-sm">{formatDate(dispute.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </div>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedDispute(dispute.id)}>
                        View Details
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                  <div className="flex gap-2">
                    {selectedDisputeData && !['resolved', 'closed'].includes(selectedDisputeData.status) && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setIsCloseDialogOpen(true)}>Close Dispute</Button>
                        <Button variant="default" size="sm" onClick={() => setIsResolveDialogOpen(true)}>Resolve</Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDispute(null)}>X</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {detailLoading && !selectedDisputeData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                  </div>
                ) : !selectedDisputeData ? (
                  <p className="text-gray-500">Dispute not found</p>
                ) : (
                  <Tabs defaultValue="details" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="chat">Project Chat</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 flex-1 overflow-y-auto">
                      <div>
                        <p className="text-sm text-gray-600">Project</p>
                        <p className="font-medium">{selectedDisputeData.project?.title || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="mt-1">{getStatusBadge(selectedDisputeData.status)}</div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Reason</p>
                        <p className="font-medium">{selectedDisputeData.reason || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Raised By</p>
                        <p className="font-medium">
                          {selectedDisputeData.raised_by_user
                            ? `${selectedDisputeData.raised_by_user.first_name || ''} ${selectedDisputeData.raised_by_user.last_name || ''}`.trim() || 'N/A'
                            : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">{selectedDisputeData.raised_by_user?.email || ''}</p>
                      </div>
                      {selectedDisputeData.description && (
                        <div>
                          <p className="text-sm text-gray-600">Description</p>
                          <p className="text-sm p-3 bg-gray-50 rounded-md mt-1">{selectedDisputeData.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="text-sm">{formatDate(selectedDisputeData.created_at)}</p>
                      </div>

                      {/* Messages / Responses History */}
                      {selectedDisputeData.responses && selectedDisputeData.responses.length > 0 && (
                        <div className="mt-6 border-t pt-4">
                          <h4 className="font-medium mb-3">Messages History</h4>
                          <div className="space-y-3">
                            {selectedDisputeData.responses.slice().sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((resp: any) => {
                              let userLabel = 'User';
                              if (resp.user_id === selectedDisputeData.raised_by) userLabel = 'Complainant';
                              else if (selectedDisputeData.project && resp.user_id === selectedDisputeData.project.owner_id) userLabel = 'Project Owner';
                              else if (selectedDisputeData.project && resp.user_id === selectedDisputeData.project.contractor_id) userLabel = 'Contractor';
                              else userLabel = 'Admin / Support';

                              return (
                                <div key={resp.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-xs">{userLabel}</span>
                                    <span className="text-xs text-gray-500">{getTimeAgo(resp.created_at)}</span>
                                  </div>
                                  <p>{resp.message}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Resolution Notes if resolved */}
                      {selectedDisputeData.resolution_notes && (
                        <div className="border-t pt-4 mt-4">
                          <p className="text-sm text-gray-600 font-medium">Resolution Notes</p>
                          <p className="text-sm p-3 bg-green-50 text-green-800 rounded-md mt-1">{selectedDisputeData.resolution_notes}</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="chat" className="flex flex-col h-[600px] sm:h-[calc(100vh-300px)]">
                      <div className="flex-1 overflow-y-auto space-y-6 p-2 pr-4">
                        {selectedDisputeData.project?.conversations && selectedDisputeData.project.conversations.length > 0 ? (
                          selectedDisputeData.project.conversations
                            .filter((c: any) => c && c.messages)
                            .flatMap((c: any) => c.messages || [])
                            .sort((a: any, b: any) => {
                              const tA = new Date(a.created_at).getTime();
                              const tB = new Date(b.created_at).getTime();
                              return (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
                            })
                            .map((msg: any) => {
                              const isOwner = msg.sender_id === selectedDisputeData.project?.owner_id;
                              const isContractor = msg.sender_id === selectedDisputeData.project?.contractor_id;

                              // Determine alignment and styles
                              const alignClass = isContractor ? 'justify-end' : 'justify-start';
                              const bubbleClass = isContractor
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none';
                              const label = isOwner ? 'Project Owner' : isContractor ? 'Contractor' : 'Unknown';

                              return (
                                <div key={msg.id} className={`flex gap-3 ${alignClass} group`}>
                                  {/* Avatar for Owner (Left side) */}
                                  {!isContractor && (
                                    <Avatar className="h-8 w-8 mt-1 border bg-white">
                                      <AvatarImage src={msg.sender?.avatar_url} />
                                      <AvatarFallback className="bg-gray-100 text-xs text-gray-600">
                                        {msg.sender?.first_name?.[0] || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}

                                  <div className={`max-w-[80%] space-y-1`}>
                                    <div className={`flex items-center gap-2 text-xs text-gray-500 ${isContractor ? 'justify-end' : ''}`}>
                                      <span className="font-medium">{msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Unknown'}</span>
                                      <span className="text-[10px] opacity-75 px-1.5 py-0.5 rounded-full bg-gray-100 border">{label}</span>
                                    </div>

                                    <div className={`p-3.5 px-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${bubbleClass}`}>
                                      {msg.content}
                                    </div>

                                    <p className={`text-[10px] text-gray-400 ${isContractor ? 'text-right' : 'text-left'}`}>
                                      {formatDate(msg.created_at)}
                                    </p>
                                  </div>

                                  {/* Avatar for Contractor (Right side) */}
                                  {isContractor && (
                                    <Avatar className="h-8 w-8 mt-1 border border-blue-200 bg-white">
                                      <AvatarImage src={msg.sender?.avatar_url} />
                                      <AvatarFallback className="bg-blue-50 text-blue-700 text-xs">
                                        {msg.sender?.first_name?.[0] || 'C'}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              );
                            })
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                            <div className="p-4 rounded-full bg-gray-100">
                              <AlertCircle className="h-8 w-8 text-gray-300" />
                            </div>
                            <p>No project chat history available</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>

              <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Resolve Dispute</DialogTitle>
                    <DialogDescription>
                      Provide a resolution decision and notes. This will unfreeze the project funds.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Resolution Decision</label>
                      <Select onValueChange={(val) => setResolutionDetails({ ...resolutionDetails, resolution: val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Refund to Owner">Refund to Owner</SelectItem>
                          <SelectItem value="Release to Contractor">Release to Contractor</SelectItem>
                          <SelectItem value="Split Payment">Split Payment</SelectItem>
                          <SelectItem value="Dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Resolution Notes</label>
                      <Textarea
                        placeholder="Explain the resolution..."
                        value={resolutionDetails.notes}
                        onChange={(e) => setResolutionDetails({ ...resolutionDetails, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>Cancel</Button>
                    <Button
                      onClick={() => resolveMutation.mutate({ resolution: resolutionDetails.resolution, resolution_notes: resolutionDetails.notes })}
                      disabled={!resolutionDetails.resolution || !resolutionDetails.notes || resolveMutation.isPending}
                    >
                      {resolveMutation.isPending ? 'Resolving...' : 'Confirm Resolution'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will close the dispute without specific financial resolution actions. This usually implies the dispute was withdrawn or invalid.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => closeMutation.mutate()}>
                      {closeMutation.isPending ? 'Closing...' : 'Close Dispute'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
