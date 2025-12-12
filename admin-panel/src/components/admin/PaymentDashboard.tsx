'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { adminService, FinancialMetrics } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { format } from 'date-fns';

export default function PaymentDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getFinancialMetrics({ period });
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load financial metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No metrics available</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const metricCards = [
    {
      title: 'Total Volume',
      value: formatCurrency(metrics.totalVolume),
      icon: DollarSign,
      trend: metrics.monthlyVolume ? formatCurrency(metrics.monthlyVolume) : undefined,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Platform Fees',
      value: formatCurrency(metrics.platformFees),
      icon: TrendingUp,
      trend: undefined,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Escrow Balance',
      value: formatCurrency(metrics.escrowBalance),
      icon: Wallet,
      trend: metrics.activeEscrowAccounts ? `${metrics.activeEscrowAccounts} accounts` : undefined,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pending Payouts',
      value: formatCurrency(metrics.pendingPayouts),
      icon: ArrowUpRight,
      trend: undefined,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Failed Payments',
      value: metrics.failedPayments.toString(),
      icon: AlertCircle,
      trend: undefined,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Refunds Processed',
      value: formatCurrency(metrics.refundsProcessed),
      icon: ArrowDownRight,
      trend: undefined,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Avg Transaction',
      value: formatCurrency(metrics.averageTransactionSize),
      icon: CreditCard,
      trend: undefined,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Success Rate',
      value: formatPercentage(metrics.paymentSuccessRate),
      icon: TrendingUp,
      trend: undefined,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Payment Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Overview of platform financial metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.trend && (
                  <p className="text-xs text-gray-500 mt-1">{card.trend}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Volume Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Daily Volume</span>
                <span className="font-semibold">
                  {metrics.dailyVolume ? formatCurrency(metrics.dailyVolume) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Weekly Volume</span>
                <span className="font-semibold">
                  {metrics.weeklyVolume ? formatCurrency(metrics.weeklyVolume) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Volume</span>
                <span className="font-semibold">
                  {metrics.monthlyVolume ? formatCurrency(metrics.monthlyVolume) : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Escrow Accounts</span>
                <span className="font-semibold">
                  {metrics.activeEscrowAccounts || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Payments</span>
                <span className="font-semibold">
                  {metrics.pendingPayments || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Success Rate</span>
                <span className="font-semibold text-green-600">
                  {formatPercentage(metrics.paymentSuccessRate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


