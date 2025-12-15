'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, Payout } from '@/src/lib/api/adminService';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';

export default function PayoutManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [holdReason, setHoldReason] = useState('');

  useEffect(() => {
    loadPayouts();
  }, [statusFilter]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const response = await adminService.getAllPayouts(params);
      if (response.success) {
        setPayouts(response.data.payouts || []);
      }
    } catch (error: any) {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayouts = payouts.filter((payout) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payout.contractor.full_name?.toLowerCase().includes(query) ||
      payout.contractor.email?.toLowerCase().includes(query)
    );
  });

  const handleApprove = async (payout: Payout) => {
    try {
      const response = await adminService.approvePayout(payout.id);
      if (response.success) {
        toast.success('Payout approved');
        loadPayouts();
      }
    } catch (error: any) {
      toast.error('Failed to approve payout');
    }
  };

  const handleHold = async () => {
    if (!selectedPayout || !holdReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const response = await adminService.holdPayout(selectedPayout.id, holdReason);
      if (response.success) {
        toast.success('Payout held');
        setShowHoldDialog(false);
        setSelectedPayout(null);
        setHoldReason('');
        loadPayouts();
      }
    } catch (error: any) {
      toast.error('Failed to hold payout');
    }
  };



  const handleResend = async (payout: Payout) => {
    try {
      const response = await adminService.resendFailedPayout(payout.id);
      if (response.success) {
        toast.success('Payout resent');
        loadPayouts();
      }
    } catch (error: any) {
      toast.error('Failed to resend payout');
    }
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-500' },
      approved: { label: 'Approved', className: 'bg-blue-500' },
      processing: { label: 'Processing', className: 'bg-indigo-500' },
      completed: { label: 'Completed', className: 'bg-green-500' },
      failed: { label: 'Failed', className: 'bg-red-500' },
      held: { label: 'Held', className: 'bg-orange-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Payout Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage contractor payouts
          </p>
        </div>
        <Button variant="outline" onClick={loadPayouts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by contractor name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="held">Held</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payouts Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contractor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Bank Account</TableHead>
                <TableHead className="hidden lg:table-cell">Scheduled Date</TableHead>
                <TableHead className="hidden lg:table-cell">Processed At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No payouts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{payout.contractor.full_name}</p>
                        <p className="text-sm text-gray-500">{payout.contractor.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payout.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {payout.bank_account ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {payout.bank_account.bank_name}
                            {payout.bank_account.verified && (
                              <CheckCircle2 className="h-3 w-3 text-green-500 inline ml-1" />
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {payout.scheduled_date
                        ? format(new Date(payout.scheduled_date), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {payout.processed_at
                        ? format(new Date(payout.processed_at), 'MMM dd, yyyy')
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {payout.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => handleApprove(payout)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {payout.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPayout(payout);
                                setShowHoldDialog(true);
                              }}
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Hold
                            </DropdownMenuItem>
                          )}
                          {payout.status === 'failed' && (
                            <DropdownMenuItem
                              onClick={() => handleResend(payout)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Resend
                            </DropdownMenuItem>
                          )}

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

      {/* Hold Dialog */}
      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hold Payout</DialogTitle>
            <DialogDescription>
              Hold this payout for investigation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hold-reason">Reason *</Label>
              <Textarea
                id="hold-reason"
                placeholder="Enter reason for holding..."
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowHoldDialog(false);
                setSelectedPayout(null);
                setHoldReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleHold} disabled={!holdReason.trim()}>
              Hold Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Payout Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>
              Complete information about this payout
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-6 py-4">
              {/* Contractor Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Contractor Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedPayout.contractor.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedPayout.contractor.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contractor ID</p>
                    <p className="font-medium text-xs">{selectedPayout.contractor.id}</p>
                  </div>
                </div>
              </div>

              {/* Payout Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Payout Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-xl text-green-600">
                      {formatCurrency(selectedPayout.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedPayout.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payout ID</p>
                    <p className="font-medium text-xs">{selectedPayout.id}</p>
                  </div>
                  {selectedPayout.project_id && (
                    <div>
                      <p className="text-sm text-gray-500">Project ID</p>
                      <p className="font-medium text-xs">{selectedPayout.project_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Account Info */}
              {selectedPayout.bank_account && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Bank Account</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="font-medium">{selectedPayout.bank_account.bank_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Type</p>
                      <p className="font-medium capitalize">{selectedPayout.bank_account.account_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Verified</p>
                      <div className="flex items-center gap-1">
                        {selectedPayout.bank_account.verified ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">Not Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="font-medium">
                      {selectedPayout.created_at
                        ? format(new Date(selectedPayout.created_at), 'MMM dd, yyyy HH:mm')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Date</p>
                    <p className="font-medium">
                      {selectedPayout.scheduled_date
                        ? format(new Date(selectedPayout.scheduled_date), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Processed At</p>
                    <p className="font-medium">
                      {selectedPayout.processed_at
                        ? format(new Date(selectedPayout.processed_at), 'MMM dd, yyyy HH:mm')
                        : 'Not yet processed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Failure Info (if failed) */}
              {selectedPayout.status === 'failed' && selectedPayout.failure_reason && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2 text-red-600">Failure Information</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Failure Reason</p>
                        <p className="text-sm text-red-700 mt-1">{selectedPayout.failure_reason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hold Info (if held) */}
              {selectedPayout.status === 'held' && selectedPayout.hold_reason && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2 text-orange-600">Hold Information</h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Hold Reason</p>
                        <p className="text-sm text-orange-700 mt-1">{selectedPayout.hold_reason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailDialog(false);
                setSelectedPayout(null);
              }}
            >
              Close
            </Button>
            {selectedPayout?.status === 'pending' && (
              <Button onClick={() => {
                handleApprove(selectedPayout);
                setShowDetailDialog(false);
                setSelectedPayout(null);
              }}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Payout
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


