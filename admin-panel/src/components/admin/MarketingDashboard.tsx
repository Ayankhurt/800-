'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { adminService, MarketingDashboard } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Share2,
  BarChart3,
} from 'lucide-react';

export default function MarketingDashboard() {
  const [dashboard, setDashboard] = useState<MarketingDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminService.getMarketingDashboard();
      if (response.success) {
        setDashboard(response.data.dashboard || response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load marketing dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading marketing dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
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
        <h1 className="text-2xl md:text-3xl font-bold">Marketing Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Track growth metrics and marketing performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Cost per Acquisition</p>
                <p className="text-xl font-bold mt-1">
                  ${dashboard.cost_per_acquisition.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Activation Rate</p>
                <p className="text-xl font-bold mt-1">{dashboard.user_activation_rate}%</p>
              </div>
              <Target className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Referrals</p>
                <p className="text-xl font-bold mt-1">
                  {dashboard.referral_statistics.total_referrals}
                </p>
              </div>
              <Share2 className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Referrers</p>
                <p className="text-xl font-bold mt-1">
                  {dashboard.referral_statistics.active_referrers}
                </p>
              </div>
              <Users className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Rewards Paid</p>
                <p className="text-xl font-bold mt-1">
                  ${dashboard.referral_statistics.rewards_paid.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Signup to Verification</p>
                <p className="text-xl font-bold mt-1">
                  {dashboard.conversion_rates.signup_to_verification}%
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acquisition Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Acquisition Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.acquisition_channels.map((channel, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">{channel.channel}</p>
                  <p className="text-sm text-gray-500">
                    {channel.users} users • ${channel.cost.toLocaleString()} cost
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{channel.conversion_rate}%</p>
                  <p className="text-sm text-gray-500">Conversion</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {dashboard.conversion_rates.signup_to_verification}%
              </p>
              <p className="text-sm text-gray-500">Signup → Verification</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {dashboard.conversion_rates.verification_to_first_job}%
              </p>
              <p className="text-sm text-gray-500">Verification → First Job</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {dashboard.conversion_rates.first_job_to_repeat}%
              </p>
              <p className="text-sm text-gray-500">First Job → Repeat</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


