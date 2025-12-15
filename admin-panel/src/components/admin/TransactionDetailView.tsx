'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { adminService, Transaction } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionDetailViewProps {
  transactionId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function TransactionDetailView({
  transactionId,
  onBack,
  onUpdate,
}: TransactionDetailViewProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTransactionDetails(transactionId);
      if (response.success) {
        setTransaction(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load transaction details');
    } finally {
      setLoading(false);
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
      completed: { label: 'Completed', className: 'bg-green-500' },
      failed: { label: 'Failed', className: 'bg-red-500' },
      refunded: { label: 'Refunded', className: 'bg-blue-500' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Transaction not found</p>
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
          <h1 className="text-2xl md:text-3xl font-bold">Transaction Details</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {transaction.transaction_id || transaction.id}
          </p>
        </div>
        <Button variant="outline" onClick={loadTransaction}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Transaction Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="font-mono text-sm">{transaction.transaction_id || transaction.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-semibold capitalize">{transaction.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                {getStatusBadge(transaction.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(transaction.amount)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Initiated At</p>
                <p>{
                  (() => {
                    const date = transaction.initiated_at ? new Date(transaction.initiated_at) : (transaction.created_at ? new Date(transaction.created_at) : null);
                    return date && !isNaN(date.getTime()) ? format(date, 'PPpp') : 'N/A';
                  })()
                }</p>
              </div>
              {transaction.completed_at && !isNaN(new Date(transaction.completed_at).getTime()) && (
                <div>
                  <p className="text-sm text-gray-600">Completed At</p>
                  <p>{format(new Date(transaction.completed_at), 'PPpp')}</p>
                </div>
              )}
              {transaction.failed_at && !isNaN(new Date(transaction.failed_at).getTime()) && (
                <div>
                  <p className="text-sm text-gray-600">Failed At</p>
                  <p>{format(new Date(transaction.failed_at), 'PPpp')}</p>
                </div>
              )}
              {transaction.failure_reason && (
                <div>
                  <p className="text-sm text-gray-600">Failure Reason</p>
                  <p className="text-red-600">{transaction.failure_reason}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payer</CardTitle>
          </CardHeader>
          <CardContent>
            {transaction.payer ? (
              <div className="space-y-2">
                <p className="font-semibold">{transaction.payer.full_name}</p>
                <p className="text-sm text-gray-600">{transaction.payer.email}</p>
              </div>
            ) : (
              <p className="text-gray-500">N/A</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payee</CardTitle>
          </CardHeader>
          <CardContent>
            {transaction.payee ? (
              <div className="space-y-2">
                <p className="font-semibold">{transaction.payee.full_name}</p>
                <p className="text-sm text-gray-600">{transaction.payee.email}</p>
              </div>
            ) : (
              <p className="text-gray-500">N/A</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fees Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Fees Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Platform Fee</span>
              <span className="font-semibold">
                {formatCurrency(transaction.fees.platform_fee)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Processing Fee</span>
              <span className="font-semibold">
                {formatCurrency(transaction.fees.processing_fee)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="font-semibold">Total Fees</span>
              <span className="font-bold text-lg">
                {formatCurrency(transaction.fees.total_fees)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transaction.project_id && (
              <div>
                <p className="text-sm text-gray-600">Project ID</p>
                <p className="font-mono text-sm">{transaction.project_id}</p>
              </div>
            )}
            {transaction.milestone_id && (
              <div>
                <p className="text-sm text-gray-600">Milestone ID</p>
                <p className="font-mono text-sm">{transaction.milestone_id}</p>
              </div>
            )}
            {transaction.payment_method && (
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold">{transaction.payment_method}</p>
              </div>
            )}
            {transaction.receipt_url && (
              <div>
                <Button
                  variant="outline"
                  onClick={() => window.open(transaction.receipt_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status History */}
      {transaction.status_history && transaction.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transaction.status_history.map((status, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge>{status.status}</Badge>
                      <span className="text-sm text-gray-600">
                        {format(new Date(status.timestamp), 'PPpp')}
                      </span>
                    </div>
                    {status.reason && (
                      <p className="text-sm text-gray-600 mt-1">{status.reason}</p>
                    )}
                    {status.updated_by && (
                      <p className="text-xs text-gray-500 mt-1">
                        Updated by: {status.updated_by.full_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Transactions */}
      {transaction.related_transactions && transaction.related_transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transaction.related_transactions.map((relatedId, index) => (
                <p key={index} className="font-mono text-sm">{relatedId}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


