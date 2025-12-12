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
  Download,
  MoreVertical,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';

export default function PayoutManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_number: '',
    routing_number: '',
    bank_name: '',
    account_type: '',
  });

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

  const handleUpdateBank = async () => {
    if (!selectedPayout) return;

    try {
      const response = await adminService.updatePayoutBankDetails(selectedPayout.id, bankDetails);
      if (response.success) {
        toast.success('Bank details updated');
        setShowBankDialog(false);
        setSelectedPayout(null);
        setBankDetails({
          account_number: '',
          routing_number: '',
          bank_name: '',
          account_type: '',
        });
        loadPayouts();
      }
    } catch (error: any) {
      toast.error('Failed to update bank details');
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

  const handleGenerate1099 = async (payout: Payout, year: number) => {
    try {
      const blob = await adminService.generate1099Form(payout.contractor.id, year);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `1099-${payout.contractor.id}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('1099 form generated');
    } catch (error: any) {
      toast.error('Failed to generate 1099 form');
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayout(payout);
                              if (payout.bank_account) {
                                setBankDetails({
                                  account_number: payout.bank_account.account_number || '',
                                  routing_number: payout.bank_account.routing_number || '',
                                  bank_name: payout.bank_account.bank_name || '',
                                  account_type: payout.bank_account.account_type || '',
                                });
                              }
                              setShowBankDialog(true);
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Update Bank Details
                          </DropdownMenuItem>
                          {payout.status === 'failed' && (
                            <DropdownMenuItem
                              onClick={() => handleResend(payout)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Resend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              const year = new Date().getFullYear();
                              handleGenerate1099(payout, year);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Generate 1099
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

      {/* Bank Details Dialog */}
      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Bank Details</DialogTitle>
            <DialogDescription>
              Update bank account information for this payout
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={bankDetails.bank_name}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, bank_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={bankDetails.account_number}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, account_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Routing Number</Label>
              <Input
                value={bankDetails.routing_number}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, routing_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select
                value={bankDetails.account_type}
                onValueChange={(value) =>
                  setBankDetails({ ...bankDetails, account_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBankDialog(false);
                setSelectedPayout(null);
                setBankDetails({
                  account_number: '',
                  routing_number: '',
                  bank_name: '',
                  account_type: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateBank}>Update Bank Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


