'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { adminService, FraudAlert } from '@/src/lib/api/adminService';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertTriangle,
  Eye,
  MoreVertical,
  RefreshCw,
  Shield,
  Lock,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

export default function FraudDetection() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [reviewResolution, setReviewResolution] = useState('');
  const [freezeAccount, setFreezeAccount] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    status: 'all',
  });

  useEffect(() => {
    loadAlerts();
  }, [filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.severity && filters.severity !== 'all') params.severity = filters.severity;
      if (filters.status && filters.status !== 'all') params.status = filters.status;

      const response = await adminService.getFraudAlerts(params);
      if (response.success) {
        setAlerts(response.data.alerts || []);
      }
    } catch (error: any) {
      toast.error('Failed to load fraud alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedAlert || !reviewResolution.trim()) {
      toast.error('Please provide a resolution');
      return;
    }

    try {
      const response = await adminService.reviewFraudAlert(selectedAlert.id, {
        status: reviewStatus,
        resolution: reviewResolution,
        freeze_account: freezeAccount,
      });
      if (response.success) {
        toast.success('Alert reviewed');
        setShowReviewDialog(false);
        setSelectedAlert(null);
        setReviewResolution('');
        setFreezeAccount(false);
        loadAlerts();
      }
    } catch (error: any) {
      toast.error('Failed to review alert');
    }
  };

  const handleFlagAccount = async (alert: FraudAlert) => {
    if (!alert.user) return;

    const reason = prompt('Enter reason for flagging account:');
    if (!reason) return;

    try {
      const response = await adminService.flagSuspiciousAccount(alert.user.id, reason);
      if (response.success) {
        toast.success('Account flagged');
        loadAlerts();
      }
    } catch (error: any) {
      toast.error('Failed to flag account');
    }
  };

  const handleContactUser = async (alert: FraudAlert) => {
    if (!alert.user) return;

    const message = prompt('Enter message to send to user:');
    if (!message) return;

    try {
      const response = await adminService.contactUserForVerification(alert.user.id, message);
      if (response.success) {
        toast.success('Message sent to user');
      }
    } catch (error: any) {
      toast.error('Failed to contact user');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig: Record<string, { label: string; className: string }> = {
      low: { label: 'Low', className: 'bg-yellow-500' },
      medium: { label: 'Medium', className: 'bg-orange-500' },
      high: { label: 'High', className: 'bg-red-500' },
      critical: { label: 'Critical', className: 'bg-red-700' },
    };

    const config = severityConfig[severity] || { label: severity, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      new: { label: 'New', className: 'bg-blue-500' },
      reviewing: { label: 'Reviewing', className: 'bg-yellow-500' },
      resolved: { label: 'Resolved', className: 'bg-green-500' },
      dismissed: { label: 'Dismissed', className: 'bg-gray-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      suspicious_transaction: 'Suspicious Transaction',
      multiple_failed_payments: 'Multiple Failed Payments',
      unusual_pattern: 'Unusual Pattern',
      duplicate_payment_method: 'Duplicate Payment Method',
      account_velocity: 'Account Velocity',
    };

    return typeLabels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fraud alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Fraud Detection</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Monitor and review fraud alerts
          </p>
        </div>
        <Button variant="outline" onClick={loadAlerts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="suspicious_transaction">Suspicious Transaction</SelectItem>
                  <SelectItem value="multiple_failed_payments">Multiple Failed Payments</SelectItem>
                  <SelectItem value="unusual_pattern">Unusual Pattern</SelectItem>
                  <SelectItem value="duplicate_payment_method">Duplicate Payment Method</SelectItem>
                  <SelectItem value="account_velocity">Account Velocity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select
                value={filters.severity}
                onValueChange={(value) => setFilters({ ...filters, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
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
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setFilters({ type: 'all', severity: 'all', status: 'all' })}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Detected At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No fraud alerts found
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{getTypeLabel(alert.type)}</TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>
                      {alert.user ? (
                        <div>
                          <p className="font-semibold">{alert.user.full_name}</p>
                          <p className="text-sm text-gray-500">{alert.user.email}</p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">{alert.description}</TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(alert.detected_at), 'PPpp')}
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
                            onClick={() => {
                              setSelectedAlert(alert);
                              setShowReviewDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review Alert
                          </DropdownMenuItem>
                          {alert.user && (
                            <DropdownMenuItem
                              onClick={() => handleFlagAccount(alert)}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Flag Account
                            </DropdownMenuItem>
                          )}
                          {alert.user && (
                            <DropdownMenuItem
                              onClick={() => handleContactUser(alert)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Contact User
                            </DropdownMenuItem>
                          )}
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

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Fraud Alert</DialogTitle>
            <DialogDescription>
              Review and resolve this fraud alert
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAlert && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Type: {getTypeLabel(selectedAlert.type)}</p>
                <p className="text-sm font-semibold">Severity: {selectedAlert.severity}</p>
                <p className="text-sm">{selectedAlert.description}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Resolution Status</Label>
              <Select
                value={reviewStatus}
                onValueChange={(value: any) => setReviewStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-resolution">Resolution Notes *</Label>
              <Textarea
                id="review-resolution"
                placeholder="Enter resolution notes..."
                value={reviewResolution}
                onChange={(e) => setReviewResolution(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="freeze-account"
                checked={freezeAccount}
                onChange={(e) => setFreezeAccount(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="freeze-account">Freeze account</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setSelectedAlert(null);
                setReviewResolution('');
                setFreezeAccount(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReview} disabled={!reviewResolution.trim()}>
              {reviewStatus === 'resolved' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Dismiss
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


