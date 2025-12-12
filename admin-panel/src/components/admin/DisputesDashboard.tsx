'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { adminService, DisputeMetrics } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  BarChart3,
} from 'lucide-react';

export default function DisputesDashboard() {
  const [metrics, setMetrics] = useState<DisputeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDisputesDashboard();
      if (response.success) {
        setMetrics(response.data.metrics || response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load disputes dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disputes dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Disputes Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Overview of dispute resolution metrics and statistics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Disputes</p>
                <p className="text-xl font-bold mt-1">{metrics.totalDisputes}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Disputes</p>
                <p className="text-xl font-bold mt-1 text-orange-600">{metrics.activeDisputes}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Resolved</p>
                <p className="text-xl font-bold mt-1 text-green-600">{metrics.resolvedDisputes}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Resolution Rate</p>
                <p className="text-xl font-bold mt-1">{metrics.resolutionRate}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Avg Resolution</p>
                <p className="text-xl font-bold mt-1">{metrics.averageResolutionTime}d</p>
              </div>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Escalation Rate</p>
                <p className="text-xl font-bold mt-1 text-red-600">{metrics.escalationRate}%</p>
              </div>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Disputes by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(metrics.disputesByType).map(([type, count]) => (
              <div key={type} className="text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-gray-500 capitalize">{type.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resolution Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resolution Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Resolved</span>
                  <span className="text-sm font-bold">
                    {metrics.resolvedDisputes} / {metrics.totalDisputes}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(metrics.resolvedDisputes / metrics.totalDisputes) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className="text-sm font-bold">{metrics.activeDisputes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${(metrics.activeDisputes / metrics.totalDisputes) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Resolution Time</p>
                <p className="text-2xl font-bold">{metrics.averageResolutionTime} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Resolution Rate</p>
                <p className="text-2xl font-bold text-green-600">{metrics.resolutionRate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Escalation Rate</p>
                <p className="text-2xl font-bold text-red-600">{metrics.escalationRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


