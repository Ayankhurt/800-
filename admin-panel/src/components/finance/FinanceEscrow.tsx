'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  XCircle
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { paymentsService } from '@/src/lib/api/paymentsService';
import { payoutsService } from '@/src/lib/api/payoutsService';
import { toast } from 'sonner';

interface FinanceEscrowProps {
  defaultTab?: string;
}

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

export function FinanceEscrow({ defaultTab = 'escrow' }: FinanceEscrowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Sync activeTab with URL query parameter changes
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab') || 'escrow';
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Handle tab change - update URL to keep it in sync
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', value);
    router.push(`/dashboard/finance?${params.toString()}`, { scroll: false });
  };

  // Fetch payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments-all'],
    queryFn: () => paymentsService.getAllPayments({ limit: 1000 }),
  });

  // Fetch payouts
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ['payouts-all'],
    queryFn: () => payoutsService.getAllPayouts({ limit: 1000 }),
  });

  // Approve payout mutation
  const approvePayoutMutation = useMutation({
    mutationFn: (id: string) => payoutsService.approvePayout(id),
    onSuccess: () => {
      toast.success('Payout approved successfully');
      queryClient.invalidateQueries({ queryKey: ['payouts-all'] });
      setSelectedPayout(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to approve payout');
    },
  });

  // Reject payout mutation
  const rejectPayoutMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      payoutsService.rejectPayout(id, reason),
    onSuccess: () => {
      toast.success('Payout rejected');
      queryClient.invalidateQueries({ queryKey: ['payouts-all'] });
      setSelectedPayout(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reject payout');
    },
  });

  const payments = paymentsData?.data || [];
  const payouts = payoutsData?.data || [];

  // Filter by search
  const filteredPayments = payments.filter((payment: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.project?.name?.toLowerCase().includes(query) ||
      payment.user?.full_name?.toLowerCase().includes(query) ||
      payment.user?.email?.toLowerCase().includes(query) ||
      payment.id?.toLowerCase().includes(query)
    );
  });

  const filteredPayouts = payouts.filter((payout: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payout.user?.full_name?.toLowerCase().includes(query) ||
      payout.user?.email?.toLowerCase().includes(query) ||
      payout.id?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalRevenue = payments
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const escrowHeld = payments
    .filter((p: any) => p.status === 'held' || p.status === 'pending')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const escrowCount = payments.filter((p: any) => p.status === 'held' || p.status === 'pending').length;

  const pendingPayoutsAmount = payouts
    .filter((p: any) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const pendingPayoutsCount = payouts.filter((p: any) => p.status === 'pending' || p.status === 'processing').length;

  const completedThisMonth = payments
    .filter((p: any) => {
      if (p.status !== 'completed') return false;
      const paymentDate = new Date(p.created_at);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'processing':
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-700">Processing</Badge>;
      case 'held':
        return <Badge className="bg-orange-100 text-orange-700">Held</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const PaymentTable = ({ data }: { data: any[] }) => {
    if (paymentsLoading) {
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
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            data.map((payment: any) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="font-medium">{payment.project?.name || 'N/A'}</div>
                </TableCell>
                <TableCell>
                  <div>{payment.user?.full_name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{payment.user?.email}</div>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell className="text-gray-600 text-sm">{formatDate(payment.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        // Navigate to payment details
                        router.push(`/dashboard/finance/payment/${payment.id}`);
                      }}>
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

  const PayoutTable = ({ data }: { data: any[] }) => {
    if (payoutsLoading) {
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
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No payouts found
              </TableCell>
            </TableRow>
          ) : (
            data.map((payout: any) => (
              <TableRow key={payout.id}>
                <TableCell>
                  <div className="font-medium">{payout.user?.full_name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{payout.user?.email}</div>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                <TableCell>{payout.payment_method || 'N/A'}</TableCell>
                <TableCell>{getStatusBadge(payout.status)}</TableCell>
                <TableCell className="text-gray-600 text-sm">{formatDate(payout.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        router.push(`/dashboard/finance/payout/${payout.id}`);
                      }}>
                        View Details
                      </DropdownMenuItem>
                      {(payout.status === 'pending' || payout.status === 'processing') && (
                        <>
                          <DropdownMenuItem 
                            className="text-green-600"
                            onClick={() => setSelectedPayout({ id: payout.id, action: 'approve' })}
                          >
                            Approve Payout
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setSelectedPayout({ id: payout.id, action: 'reject' })}
                          >
                            Reject Payout
                          </DropdownMenuItem>
                        </>
                      )}
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

  const escrowPayments = filteredPayments.filter((p: any) => p.status === 'held' || p.status === 'pending');
  const completedPayments = filteredPayments.filter((p: any) => p.status === 'completed');
  const pendingPayouts = filteredPayouts.filter((p: any) => p.status === 'pending' || p.status === 'processing');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Finance & Escrow</h2>
          <p className="text-gray-600">Track payments, escrow releases, and financial reports</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          {/* Export removed - Core features only */}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total Revenue</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
                <p className="text-green-600 mt-1 text-sm">All time</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Escrow Held</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(escrowHeld)}</p>
                <p className="text-gray-600 mt-1 text-sm">{escrowCount} transactions</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Pending Payouts</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(pendingPayoutsAmount)}</p>
                <p className="text-gray-600 mt-1 text-sm">{pendingPayoutsCount} pending</p>
              </div>
              <div className="bg-yellow-50 text-yellow-600 p-3 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Completed This Month</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(completedThisMonth)}</p>
                <p className="text-gray-600 mt-1 text-sm">This month</p>
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
                placeholder="Search by project, party, or transaction ID..." 
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="escrow">Escrow Overview</TabsTrigger>
          <TabsTrigger value="payouts">
            Payouts
            {pendingPayoutsCount > 0 && (
              <Badge className="ml-2 bg-blue-500">{pendingPayoutsCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">All Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="escrow">
          <Card>
            <CardHeader>
              <CardTitle>Escrow Transactions ({escrowPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentTable data={escrowPayments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests ({payouts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <PayoutTable data={filteredPayouts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>All Payments ({payments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentTable data={filteredPayments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Payout Dialog */}
      <AlertDialog open={!!selectedPayout} onOpenChange={(open) => !open && setSelectedPayout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedPayout?.action === 'approve' ? 'Approve Payout' : 'Reject Payout'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPayout?.action === 'approve' 
                ? 'Are you sure you want to approve this payout? This action cannot be undone.'
                : 'Please provide a reason for rejecting this payout.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedPayout?.action === 'reject' && (
            <div className="py-4">
              <Input
                placeholder="Rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selectedPayout) return;
                if (selectedPayout.action === 'approve') {
                  approvePayoutMutation.mutate(selectedPayout.id);
                } else {
                  rejectPayoutMutation.mutate({ id: selectedPayout.id, reason: rejectReason });
                }
              }}
              className={selectedPayout?.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
              disabled={
                (selectedPayout?.action === 'reject' && !rejectReason.trim()) ||
                approvePayoutMutation.isPending ||
                rejectPayoutMutation.isPending
              }
            >
              {(approvePayoutMutation.isPending || rejectPayoutMutation.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : selectedPayout?.action === 'approve' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {selectedPayout?.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
