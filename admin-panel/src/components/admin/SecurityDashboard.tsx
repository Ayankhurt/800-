'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { adminService, SecurityDashboard } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  Shield,
  AlertTriangle,
  Activity,
  Lock,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Badge } from '../ui/badge';

export default function SecurityDashboard() {
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSecurityDashboard();
      if (response.success) {
        setDashboard(response.data.dashboard || response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load security dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading security dashboard...</p>
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
        <h1 className="text-2xl md:text-3xl font-bold">Security Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Monitor security threats, activities, and system health
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Sessions</p>
                <p className="text-xl font-bold mt-1">{dashboard.active_sessions}</p>
              </div>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Failed Logins</p>
                <p className="text-xl font-bold mt-1 text-red-600">
                  {dashboard.failed_login_attempts}
                </p>
              </div>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Suspicious Activities</p>
                <p className="text-xl font-bold mt-1 text-orange-600">
                  {dashboard.suspicious_activities}
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Security Alerts</p>
                <p className="text-xl font-bold mt-1">
                  {dashboard.security_alerts.critical + dashboard.security_alerts.high}
                </p>
              </div>
              <Shield className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{dashboard.security_alerts.critical}</p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{dashboard.security_alerts.high}</p>
              <p className="text-sm text-gray-500">High</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{dashboard.security_alerts.medium}</p>
              <p className="text-sm text-gray-500">Medium</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{dashboard.security_alerts.low}</p>
              <p className="text-sm text-gray-500">Low</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerability Scan */}
      <Card>
        <CardHeader>
          <CardTitle>Vulnerability Scan Results</CardTitle>
          <p className="text-sm text-gray-500">
            Last scan: {dashboard.vulnerability_scan_results.last_scan
              ? new Date(dashboard.vulnerability_scan_results.last_scan).toLocaleString()
              : 'Never'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {dashboard.vulnerability_scan_results.critical}
              </p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {dashboard.vulnerability_scan_results.high}
              </p>
              <p className="text-sm text-gray-500">High</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {dashboard.vulnerability_scan_results.medium}
              </p>
              <p className="text-sm text-gray-500">Medium</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {dashboard.vulnerability_scan_results.low}
              </p>
              <p className="text-sm text-gray-500">Low</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Threat Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-bold">
                  {dashboard.threat_detection.active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>
              {dashboard.threat_detection.active ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Threats blocked (24h): {dashboard.threat_detection.threats_blocked_24h}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DDoS Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-bold">
                  {dashboard.ddos_protection.status === 'active' ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>
              {dashboard.ddos_protection.status === 'active' ? (
                <Shield className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Attacks blocked (24h): {dashboard.ddos_protection.attacks_blocked_24h}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Effectiveness</p>
                <p className="text-lg font-bold">{dashboard.rate_limiting.effectiveness}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Requests blocked (24h): {dashboard.rate_limiting.requests_blocked_24h}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


