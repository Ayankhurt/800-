'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { adminService, PlatformMetrics } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Users,
  Briefcase,
  FolderKanban,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export default function PlatformAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPlatformMetrics({ period });
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load platform metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading platform metrics...</p>
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Platform Analytics Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Comprehensive overview of platform performance
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

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.users.active.toLocaleString()} active • {metrics.users.new.toLocaleString()} new
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Retention: {formatPercentage(metrics.users.retentionRate)}
            </p>
          </CardContent>
        </Card>

        {/* Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.jobs.posted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.jobs.filled.toLocaleString()} filled • {formatPercentage(metrics.jobs.fillRate)} fill rate
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg time to fill: {metrics.jobs.averageTimeToFill} days
            </p>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.projects.active.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.projects.completed.toLocaleString()} completed
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              On-time: {formatPercentage(metrics.projects.onTimeRate)} • Avg value: {formatCurrency(metrics.projects.averageValue)}
            </p>
          </CardContent>
        </Card>

        {/* Financials */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financials</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.financials.totalVolume)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue: {formatCurrency(metrics.financials.platformRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg transaction: {formatCurrency(metrics.financials.averageTransactionSize)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.users.byRole).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{role.replace('_', ' ')}</span>
                  <span className="font-semibold">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Daily Active Users (DAU)</span>
                <span className="font-semibold">{metrics.engagement.dau.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Active Users (MAU)</span>
                <span className="font-semibold">{metrics.engagement.mau.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">DAU/MAU Ratio</span>
                <span className="font-semibold">{formatPercentage(metrics.engagement.dauMauRatio)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Session Time</span>
                <span className="font-semibold">{metrics.engagement.averageSessionTime} min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart visualization placeholder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart visualization placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


