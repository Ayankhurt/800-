'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, Bid } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
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
import { Badge } from '../ui/badge';
// Checkbox removed - Core features only
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
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Flag,
  Mail,
  Clock,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { BidFilters, BidFilters as BidFiltersType } from './BidFilters';

export default function BidsManagement() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Bulk selection removed - Core features only
  const [filters, setFilters] = useState<BidFiltersType>({});
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [newDeadline, setNewDeadline] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadBids();
  }, [filters]);

  const loadBids = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.trade_type) params.trade_type = filters.trade_type;
      if (filters.budget_min) params.budget_min = filters.budget_min;
      if (filters.budget_max) params.budget_max = filters.budget_max;
      if (filters.deadline_from) params.deadline_from = filters.deadline_from instanceof Date ? filters.deadline_from.toISOString() : filters.deadline_from;
      if (filters.deadline_to) params.deadline_to = filters.deadline_to instanceof Date ? filters.deadline_to.toISOString() : filters.deadline_to;
      if (filters.created_by) params.created_by = filters.created_by;

      const response = await adminService.getAllBids(params);
      if (response.success) {
        setBids(response.data.bids || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const filteredBids = useMemo(() => {
    let filtered = bids;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bid) =>
          bid.title?.toLowerCase().includes(query) ||
          bid.description?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [bids, searchQuery]);

  // Bulk selection removed - Core features only

  const handleViewBid = async (bidId: string) => {
    try {
      const response = await adminService.getBidDetails(bidId);
      if (response.success) {
        setCurrentBid(response.data);
        setSelectedBidId(bidId);
      }
    } catch (error: any) {
      toast.error('Failed to load bid details');
    }
  };

  const handleEdit = (bid: Bid) => {
    setCurrentBid(bid);
    setEditData({
      title: bid.title,
      description: bid.description,
      budget: bid.budget,
      deadline: bid.deadline,
    });
    setShowEditDialog(true);
  };

  const handleUpdateBid = async () => {
    if (!currentBid) return;
    try {
      const response = await adminService.updateBid(currentBid.id, editData);
      if (response.success) {
        toast.success('Bid updated successfully');
        setShowEditDialog(false);
        loadBids();
      }
    } catch (error: any) {
      toast.error('Failed to update bid');
    }
  };

  const handleExtendDeadline = async () => {
    if (!currentBid) return;
    try {
      const response = await adminService.extendBidDeadline(currentBid.id, newDeadline);
      if (response.success) {
        toast.success('Deadline extended');
        setShowExtendDialog(false);
        setNewDeadline('');
        loadBids();
      }
    } catch (error: any) {
      toast.error('Failed to extend deadline');
    }
  };

  const handleCloseBid = async (bidId: string) => {
    try {
      const response = await adminService.closeBid(bidId);
      if (response.success) {
        toast.success('Bid closed');
        loadBids();
      }
    } catch (error: any) {
      toast.error('Failed to close bid');
    }
  };

  const handleCancelBid = async () => {
    if (!currentBid || !cancelReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      const response = await adminService.cancelBid(currentBid.id, cancelReason);
      if (response.success) {
        toast.success('Bid cancelled');
        setShowCancelDialog(false);
        setCancelReason('');
        loadBids();
      }
    } catch (error: any) {
      toast.error('Failed to cancel bid');
    }
  };

  const handleFlag = async () => {
    if (!currentBid || !flagReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      const response = await adminService.flagBidActivity(currentBid.id, flagReason);
      if (response.success) {
        toast.success('Bid flagged');
        setShowFlagDialog(false);
        setFlagReason('');
        loadBids();
      }
    } catch (error: any) {
      toast.error('Failed to flag bid');
    }
  };

  const handleContact = async () => {
    if (!currentBid || !contactMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    try {
      const response = await adminService.contactBidCreator(currentBid.id, contactMessage);
      if (response.success) {
        toast.success('Message sent');
        setShowContactDialog(false);
        setContactMessage('');
      }
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      open: { label: 'Open', className: 'bg-green-500' },
      closed: { label: 'Closed', className: 'bg-gray-500' },
      awarded: { label: 'Awarded', className: 'bg-blue-500' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (selectedBidId && currentBid) {
    return (
      <BidDetailView
        bidId={selectedBidId}
        bid={currentBid}
        onBack={() => {
          setSelectedBidId(null);
          setCurrentBid(null);
        }}
        onUpdate={loadBids}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Bids Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage all bids created on the platform
          </p>
        </div>
        <Button variant="outline" onClick={loadBids}>
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search bids by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <BidFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() => setFilters({})}
        />
      </div>

      {/* Bids Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bid Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Trade Type</TableHead>
                <TableHead className="hidden lg:table-cell">Budget</TableHead>
                <TableHead className="hidden lg:table-cell">Deadline</TableHead>
                <TableHead className="hidden xl:table-cell">Created By</TableHead>
                <TableHead className="hidden xl:table-cell">Submissions</TableHead>
                <TableHead className="hidden xl:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No bids found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{bid.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {bid.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(bid.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {bid.trade_type || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {bid.budget ? `$${bid.budget.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {bid.deadline
                        ? format(new Date(bid.deadline), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {bid.created_by?.full_name || bid.created_by?.email || '-'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {bid.submissions?.length || 0}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {bid.created_at
                        ? format(new Date(bid.created_at), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewBid(bid.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(bid)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentBid(bid);
                              setShowExtendDialog(true);
                            }}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Extend Deadline
                          </DropdownMenuItem>
                          {bid.status === 'open' && (
                            <DropdownMenuItem onClick={() => handleCloseBid(bid.id)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Close Bid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentBid(bid);
                              setShowCancelDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Bid
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentBid(bid);
                              setShowFlagDialog(true);
                            }}
                          >
                            <Flag className="h-4 w-4 mr-2" />
                            Flag Suspicious Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentBid(bid);
                              setShowContactDialog(true);
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Contact Creator
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bid Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget</Label>
                <Input
                  type="number"
                  value={editData.budget || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, budget: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input
                  type="datetime-local"
                  value={editData.deadline ? new Date(editData.deadline).toISOString().slice(0, 16) : ''}
                  onChange={(e) =>
                    setEditData({ ...editData, deadline: e.target.value || undefined })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBid}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Deadline Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Deadline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Deadline</Label>
              <Input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendDeadline} disabled={!newDeadline}>
              Extend Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Suspicious Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={4}
                placeholder="Enter reason for flagging..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFlag} disabled={!flagReason.trim()}>
              Flag Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Bid Creator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Message</Label>
              <Textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={6}
                placeholder="Enter your message..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleContact} disabled={!contactMessage.trim()}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Bid</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this bid? Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                placeholder="Enter reason for cancellation..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCancelBid} disabled={!cancelReason.trim()} className="bg-red-600 hover:bg-red-700">
              Cancel Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simplified Bid Detail View Component
function BidDetailView({
  bidId,
  bid,
  onBack,
  onUpdate,
}: {
  bidId: string;
  bid: Bid;
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBidDetails();
  }, [bidId]);

  const loadBidDetails = async () => {
    try {
      const [subsRes, timelineRes] = await Promise.all([
        adminService.getBidSubmissions(bidId),
        adminService.getBidTimeline(bidId),
      ]);
      if (subsRes.success) {
        setSubmissions(subsRes.data.submissions || subsRes.data || []);
      }
      if (timelineRes.success) {
        setTimeline(timelineRes.data.timeline || timelineRes.data || []);
      }
    } catch (error: any) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{bid.title}</h1>
          <p className="text-sm text-gray-600">Bid ID: {bid.id}</p>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-gray-700">{bid.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{bid.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium">{bid.budget ? `$${bid.budget.toLocaleString()}` : '-'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Submissions ({submissions.length})</h3>
              {submissions.length === 0 ? (
                <p className="text-sm text-gray-500">No submissions yet</p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="border rounded p-3">
                      <p className="font-medium">{sub.contractor?.full_name || sub.contractor_id}</p>
                      <p className="text-sm text-gray-600">${sub.bid_amount?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


