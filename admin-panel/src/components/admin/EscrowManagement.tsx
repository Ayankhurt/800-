'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, EscrowAccount } from '@/src/lib/api/adminService';
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
  Search,
  Download,
  MoreVertical,
  Eye,
  RefreshCw,
  Lock,
  Unlock,
  DollarSign,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { EscrowDetailView } from './EscrowDetailView';

export default function EscrowManagement() {
  const [accounts, setAccounts] = useState<EscrowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<EscrowAccount | null>(null);
  const [releaseAmount, setReleaseAmount] = useState('');
  const [releaseReason, setReleaseReason] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllEscrowAccounts();
      if (response.success) {
        setAccounts(response.data.accounts || []);
      }
    } catch (error: any) {
      toast.error('Failed to load escrow accounts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      account.project?.title?.toLowerCase().includes(query) ||
      account.owner.full_name?.toLowerCase().includes(query) ||
      account.contractor.full_name?.toLowerCase().includes(query)
    );
  });

  const handleRelease = async () => {
    if (!selectedAccount || !releaseAmount || !releaseReason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await adminService.releaseEscrowPayment(selectedAccount.id, {
        amount: Number(releaseAmount),
        reason: releaseReason,
        emergency: true,
      });
      if (response.success) {
        toast.success('Payment released');
        setShowReleaseDialog(false);
        setSelectedAccount(null);
        setReleaseAmount('');
        setReleaseReason('');
        loadAccounts();
      }
    } catch (error: any) {
      toast.error('Failed to release payment');
    }
  };

  const handleFreeze = async () => {
    if (!selectedAccount || !freezeReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const response = await adminService.freezeEscrowAccount(selectedAccount.id, freezeReason);
      if (response.success) {
        toast.success('Account frozen');
        setShowFreezeDialog(false);
        setSelectedAccount(null);
        setFreezeReason('');
        loadAccounts();
      }
    } catch (error: any) {
      toast.error('Failed to freeze account');
    }
  };

  const handleUnfreeze = async (account: EscrowAccount) => {
    const reason = prompt('Enter reason for unfreezing:');
    if (!reason) return;

    try {
      const response = await adminService.unfreezeEscrowAccount(account.id, reason);
      if (response.success) {
        toast.success('Account unfrozen');
        loadAccounts();
      }
    } catch (error: any) {
      toast.error('Failed to unfreeze account');
    }
  };

  const handleRefund = async () => {
    if (!selectedAccount || !refundReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const response = await adminService.refundEscrowToOwner(selectedAccount.id, {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason,
      });
      if (response.success) {
        toast.success('Refund processed');
        setShowRefundDialog(false);
        setSelectedAccount(null);
        setRefundAmount('');
        setRefundReason('');
        loadAccounts();
      }
    } catch (error: any) {
      toast.error('Failed to process refund');
    }
  };

  const handleAdjust = async () => {
    if (!selectedAccount || !adjustAmount || !adjustReason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await adminService.adjustEscrowAmount(selectedAccount.id, {
        new_amount: Number(adjustAmount),
        reason: adjustReason,
      });
      if (response.success) {
        toast.success('Escrow amount adjusted');
        setShowAdjustDialog(false);
        setSelectedAccount(null);
        setAdjustAmount('');
        setAdjustReason('');
        loadAccounts();
      }
    } catch (error: any) {
      toast.error('Failed to adjust escrow amount');
    }
  };

  const handleGenerateReport = async (account: EscrowAccount) => {
    try {
      const blob = await adminService.generateEscrowReport(account.id, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `escrow-report-${account.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report generated');
    } catch (error: any) {
      toast.error('Failed to generate report');
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
      active: { label: 'Active', className: 'bg-green-500' },
      frozen: { label: 'Frozen', className: 'bg-red-500' },
      closed: { label: 'Closed', className: 'bg-gray-500' },
      disputed: { label: 'Disputed', className: 'bg-orange-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (selectedAccountId) {
    return (
      <EscrowDetailView
        escrowId={selectedAccountId}
        onBack={() => setSelectedAccountId(null)}
        onUpdate={() => {
          loadAccounts();
          setSelectedAccountId(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading escrow accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Escrow Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage all escrow accounts
          </p>
        </div>
        <Button variant="outline" onClick={loadAccounts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by project, owner, or contractor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Accounts Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Released</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No escrow accounts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      {account.project?.title || account.project_id}
                    </TableCell>
                    <TableCell>{account.owner.full_name}</TableCell>
                    <TableCell>{account.contractor.full_name}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(account.total_amount)}
                    </TableCell>
                    <TableCell>{formatCurrency(account.released_amount)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(account.remaining_balance)}
                    </TableCell>
                    <TableCell>{getStatusBadge(account.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedAccountId(account.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {account.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowReleaseDialog(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Release Payment
                            </DropdownMenuItem>
                          )}
                          {account.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowFreezeDialog(true);
                              }}
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              Freeze Account
                            </DropdownMenuItem>
                          )}
                          {account.status === 'frozen' && (
                            <DropdownMenuItem
                              onClick={() => handleUnfreeze(account)}
                            >
                              <Unlock className="h-4 w-4 mr-2" />
                              Unfreeze Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAccount(account);
                              setShowRefundDialog(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refund to Owner
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAccount(account);
                              setShowAdjustDialog(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Adjust Amount
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleGenerateReport(account)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report
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

      {/* Release Dialog */}
      <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Escrow Payment</DialogTitle>
            <DialogDescription>
              Manually release payment from escrow account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                placeholder={`Max: ${selectedAccount ? formatCurrency(selectedAccount.remaining_balance) : ''}`}
                value={releaseAmount}
                onChange={(e) => setReleaseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release-reason">Reason *</Label>
              <Textarea
                id="release-reason"
                placeholder="Enter reason for release..."
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReleaseDialog(false);
                setSelectedAccount(null);
                setReleaseAmount('');
                setReleaseReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRelease} disabled={!releaseAmount || !releaseReason.trim()}>
              Release Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freeze Dialog */}
      <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze Escrow Account</DialogTitle>
            <DialogDescription>
              Freeze this escrow account (e.g., for disputes)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="freeze-reason">Reason *</Label>
              <Textarea
                id="freeze-reason"
                placeholder="Enter reason for freezing..."
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFreezeDialog(false);
                setSelectedAccount(null);
                setFreezeReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleFreeze} disabled={!freezeReason.trim()}>
              Freeze Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund to Owner</DialogTitle>
            <DialogDescription>
              Refund escrow amount to project owner
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (optional)</Label>
              <Input
                type="number"
                placeholder={`Max: ${selectedAccount ? formatCurrency(selectedAccount.remaining_balance) : ''}`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Leave empty to refund full remaining balance
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason *</Label>
              <Textarea
                id="refund-reason"
                placeholder="Enter refund reason..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRefundDialog(false);
                setSelectedAccount(null);
                setRefundAmount('');
                setRefundReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={!refundReason.trim()}>
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Escrow Amount</DialogTitle>
            <DialogDescription>
              Adjust the total escrow amount (e.g., for change orders)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Total Amount *</Label>
              <Input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-reason">Reason *</Label>
              <Textarea
                id="adjust-reason"
                placeholder="Enter reason for adjustment..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdjustDialog(false);
                setSelectedAccount(null);
                setAdjustAmount('');
                setAdjustReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdjust} disabled={!adjustAmount || !adjustReason.trim()}>
              Adjust Amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


