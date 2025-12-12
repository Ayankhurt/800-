'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, Transaction } from '@/src/lib/api/adminService';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
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
  XCircle,
  MessageSquare,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { TransactionDetailView } from './TransactionDetailView';

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
  });
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.amount_min) params.amount_min = Number(filters.amount_min);
      if (filters.amount_max) params.amount_max = Number(filters.amount_max);

      const response = await adminService.getAllTransactions(params);
      if (response.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error: any) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.transaction_id?.toLowerCase().includes(query) ||
          tx.payer?.full_name?.toLowerCase().includes(query) ||
          tx.payee?.full_name?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [transactions, searchQuery]);

  const handleExport = async () => {
    try {
      const exportParams: any = {};
      if (filters.type && filters.type !== 'all') exportParams.type = filters.type;
      if (filters.status && filters.status !== 'all') exportParams.status = filters.status;
      if (filters.date_from) exportParams.date_from = filters.date_from;
      if (filters.date_to) exportParams.date_to = filters.date_to;

      const blob = await adminService.exportTransactions(exportParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Transactions exported successfully');
    } catch (error: any) {
      toast.error('Failed to export transactions');
    }
  };

  const handleRefund = async () => {
    if (!selectedTransaction || !refundReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const response = await adminService.issueRefund(selectedTransaction.id, {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason,
        notify_user: true,
      });
      if (response.success) {
        toast.success('Refund issued successfully');
        setShowRefundDialog(false);
        setSelectedTransaction(null);
        setRefundAmount('');
        setRefundReason('');
        loadTransactions();
      }
    } catch (error: any) {
      toast.error('Failed to issue refund');
    }
  };

  const handleCancel = async () => {
    if (!selectedTransaction || !cancelReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const response = await adminService.cancelTransaction(selectedTransaction.id, cancelReason);
      if (response.success) {
        toast.success('Transaction cancelled');
        setShowCancelDialog(false);
        setSelectedTransaction(null);
        setCancelReason('');
        loadTransactions();
      }
    } catch (error: any) {
      toast.error('Failed to cancel transaction');
    }
  };

  const handleContact = async () => {
    if (!selectedTransaction || !contactMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const response = await adminService.contactTransactionParties(selectedTransaction.id, contactMessage);
      if (response.success) {
        toast.success('Message sent');
        setShowContactDialog(false);
        setSelectedTransaction(null);
        setContactMessage('');
      }
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  const handleFlagFraud = async (transaction: Transaction) => {
    const reason = prompt('Enter reason for flagging as fraud:');
    if (!reason) return;

    try {
      const response = await adminService.flagTransactionFraud(transaction.id, reason);
      if (response.success) {
        toast.success('Transaction flagged for fraud review');
        loadTransactions();
      }
    } catch (error: any) {
      toast.error('Failed to flag transaction');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-500' },
      completed: { label: 'Completed', className: 'bg-green-500' },
      failed: { label: 'Failed', className: 'bg-red-500' },
      refunded: { label: 'Refunded', className: 'bg-blue-500' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; className: string }> = {
      deposit: { label: 'Deposit', className: 'bg-blue-100 text-blue-800' },
      payment: { label: 'Payment', className: 'bg-green-100 text-green-800' },
      refund: { label: 'Refund', className: 'bg-orange-100 text-orange-800' },
      payout: { label: 'Payout', className: 'bg-purple-100 text-purple-800' },
      fee: { label: 'Fee', className: 'bg-gray-100 text-gray-800' },
    };

    const config = typeConfig[type] || { label: type, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (selectedTransactionId) {
    return (
      <TransactionDetailView
        transactionId={selectedTransactionId}
        onBack={() => setSelectedTransactionId(null)}
        onUpdate={() => {
          loadTransactions();
          setSelectedTransactionId(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Transaction Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage all platform transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={loadTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by transaction ID, payer, or payee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="payout">Payout</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
            <div>
              <Label>Amount Min</Label>
              <Input
                type="number"
                placeholder="Min amount"
                value={filters.amount_min}
                onChange={(e) => setFilters({ ...filters, amount_min: e.target.value })}
              />
            </div>
            <div>
              <Label>Amount Max</Label>
              <Input
                type="number"
                placeholder="Max amount"
                value={filters.amount_max}
                onChange={(e) => setFilters({ ...filters, amount_max: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  type: '',
                  status: '',
                  date_from: '',
                  date_to: '',
                  amount_min: '',
                  amount_max: '',
                })
              }
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">
                      {tx.transaction_id || tx.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>{getTypeBadge(tx.type)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      {tx.payer?.full_name || tx.payer?.email || '-'}
                    </TableCell>
                    <TableCell>
                      {tx.payee?.full_name || tx.payee?.email || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {tx.initiated_at
                        ? format(new Date(tx.initiated_at), 'MMM dd, yyyy')
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
                            onClick={() => setSelectedTransactionId(tx.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {tx.receipt_url && (
                            <DropdownMenuItem
                              onClick={() => window.open(tx.receipt_url, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Receipt
                            </DropdownMenuItem>
                          )}
                          {tx.status === 'completed' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTransaction(tx);
                                setShowRefundDialog(true);
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Issue Refund
                            </DropdownMenuItem>
                          )}
                          {tx.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTransaction(tx);
                                setShowCancelDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setShowContactDialog(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact Parties
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleFlagFraud(tx)}
                            className="text-red-600"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Flag Fraud
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

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>
              Issue a refund for transaction {selectedTransaction?.transaction_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Refund Amount (optional)</Label>
              <Input
                type="number"
                placeholder={`Max: ${selectedTransaction ? formatCurrency(selectedTransaction.amount) : ''}`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Leave empty to refund full amount
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
                setSelectedTransaction(null);
                setRefundAmount('');
                setRefundReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={!refundReason.trim()}>
              Issue Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Transaction</DialogTitle>
            <DialogDescription>
              Cancel pending transaction {selectedTransaction?.transaction_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter cancellation reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setSelectedTransaction(null);
                setCancelReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCancel} disabled={!cancelReason.trim()}>
              Cancel Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Transaction Parties</DialogTitle>
            <DialogDescription>
              Send a message to parties involved in this transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea
                id="contact-message"
                placeholder="Enter message..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowContactDialog(false);
                setSelectedTransaction(null);
                setContactMessage('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleContact} disabled={!contactMessage.trim()}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


