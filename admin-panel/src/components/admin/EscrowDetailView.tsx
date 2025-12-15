'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { adminService, EscrowAccount } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface EscrowDetailViewProps {
  escrowId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function EscrowDetailView({
  escrowId,
  onBack,
  onUpdate,
}: EscrowDetailViewProps) {
  const [account, setAccount] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccount();
  }, [escrowId]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const response = await adminService.getEscrowDetails(escrowId);
      if (response.success) {
        setAccount(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load escrow details');
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
      active: { label: 'Active', className: 'bg-green-500' },
      frozen: { label: 'Frozen', className: 'bg-red-500' },
      closed: { label: 'Closed', className: 'bg-gray-500' },
      disputed: { label: 'Disputed', className: 'bg-orange-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading escrow details...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Escrow account not found</p>
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
          <h1 className="text-2xl md:text-3xl font-bold">Escrow Account Details</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {account.project?.title || account.project_id}
          </p>
        </div>
        <Button variant="outline" onClick={loadAccount}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                {getStatusBadge(account.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(account.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Released Amount</p>
                <p className="text-xl font-semibold">{formatCurrency(account.released_amount)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Remaining Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(account.remaining_balance)}
                </p>
              </div>
              {account.frozen_amount && (
                <div>
                  <p className="text-sm text-gray-600">Frozen Amount</p>
                  <p className="text-xl font-semibold text-red-600">
                    {formatCurrency(account.frozen_amount)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p>{format(new Date(account.created_at), 'PPpp')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{account.owner?.full_name || 'N/A'}</p>
              <p className="text-sm text-gray-600">{account.owner?.email || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contractor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{account.contractor?.full_name || 'N/A'}</p>
              <p className="text-sm text-gray-600">{account.contractor?.email || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      {account.milestones && account.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {account.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{milestone.name}</p>
                    <p className="text-sm text-gray-600">
                      {milestone.scheduled_release_date
                        ? `Scheduled: ${format(new Date(milestone.scheduled_release_date), 'PP')}`
                        : 'No scheduled date'}
                    </p>
                    {milestone.released_at && (
                      <p className="text-sm text-green-600">
                        Released: {format(new Date(milestone.released_at), 'PP')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(milestone.amount)}</p>
                    <Badge
                      className={
                        milestone.status === 'released'
                          ? 'bg-green-500'
                          : milestone.status === 'disputed'
                            ? 'bg-orange-500'
                            : 'bg-yellow-500'
                      }
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      {account.transaction_history && account.transaction_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {account.transaction_history.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{tx.type}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(tx.initiated_at), 'PPpp')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(tx.amount)}</p>
                    <Badge
                      className={
                        tx.status === 'completed'
                          ? 'bg-green-500'
                          : tx.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


