'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, VerificationQueueItem, VerificationStats } from '@/src/lib/api/adminService';
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
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  FileText,
  Shield,
  Building,
  UserCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useRouter } from 'next/navigation';

export default function VerificationQueue() {
  const router = useRouter();
  const [queueItems, setQueueItems] = useState<VerificationQueueItem[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Bulk selection and batch assign removed - Core features only
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    priority: 'all',
  });
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');

  useEffect(() => {
    loadQueue();
    loadStats();
  }, [filters, sortBy]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.priority && filters.priority !== 'all') params.priority = filters.priority;

      const response = await adminService.getVerificationQueue(params);
      if (response.success) {
        let items = response.data.items || response.data || [];

        // Map backend fields to frontend interface
        items = items.map((item: any) => ({
          ...item,
          type: item.type || item.verification_type, // Map verification_type to type
        }));

        // Sort items
        if (sortBy === 'priority') {
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
          items = items.sort((a: any, b: any) =>
            (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
          );
        } else {
          items = items.sort((a: any, b: any) =>
            new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
          );
        }

        setQueueItems(items);
      }
    } catch (error: any) {
      toast.error('Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminService.getVerificationStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      // Handle error silently
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = queueItems;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.user?.full_name?.toLowerCase().includes(query) ||
          item.user?.email?.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [queueItems, searchQuery]);

  // Bulk selection and batch assign removed - Core features only

  const handleViewVerification = (item: VerificationQueueItem) => {
    const routeMap: Record<string, string> = {
      identity: `/dashboard/verification/identity/${item.id}`,
      license: `/dashboard/verification/license/${item.id}`,
      insurance: `/dashboard/verification/insurance/${item.id}`,
      background_check: `/dashboard/verification/background-check/${item.id}`,
      // Map business types to identity page as fallback/handler
      business: `/dashboard/verification/identity/${item.id}`,
      business_registration: `/dashboard/verification/identity/${item.id}`,
    };
    router.push(routeMap[item.type] || '/dashboard/verification');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'identity':
        return <UserCheck className="h-4 w-4" />;
      case 'license':
        return <FileText className="h-4 w-4" />;
      case 'insurance':
        return <Shield className="h-4 w-4" />;
      case 'background_check':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'identity':
        return 'Identity';
      case 'license':
        return 'License';
      case 'insurance':
        return 'Insurance';
      case 'background_check':
        return 'Background Check';
      default:
        return type;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; className: string }> = {
      urgent: { label: 'Urgent', className: 'bg-red-500' },
      high: { label: 'High', className: 'bg-orange-500' },
      normal: { label: 'Normal', className: 'bg-blue-500' },
      low: { label: 'Low', className: 'bg-gray-500' },
    };
    const c = config[priority] || { label: priority, className: 'bg-gray-500' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-500' },
      in_review: { label: 'In Review', className: 'bg-blue-500' },
      approved: { label: 'Approved', className: 'bg-green-500' },
      rejected: { label: 'Rejected', className: 'bg-red-500' },
      expired: { label: 'Expired', className: 'bg-gray-500' },
    };
    const c = config[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Verification Queue</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Manage pending verifications and track processing metrics
        </p>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Pending Identity</p>
                  <p className="text-xl font-bold mt-1">{stats.pending_by_type.identity}</p>
                </div>
                <UserCheck className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Pending License</p>
                  <p className="text-xl font-bold mt-1">{stats.pending_by_type.license}</p>
                </div>
                <FileText className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Pending Insurance</p>
                  <p className="text-xl font-bold mt-1">{stats.pending_by_type.insurance}</p>
                </div>
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Pending Background</p>
                  <p className="text-xl font-bold mt-1">{stats.pending_by_type.background_check}</p>
                </div>
                <Building className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Avg Processing</p>
                  <p className="text-xl font-bold mt-1">{stats.average_processing_time}h</p>
                </div>
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Expiring Soon</p>
                  <p className="text-xl font-bold mt-1 text-orange-600">{stats.expiring_soon}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approval/Rejection Rates */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="text-sm font-bold">{stats.approval_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${stats.approval_rate}%` }}
                    />
                  </div>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rejection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Rejected</span>
                    <span className="text-sm font-bold">{stats.rejection_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${stats.rejection_rate}%` }}
                    />
                  </div>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by user name, email, or verification ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters({ ...filters, type: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="identity">Identity</SelectItem>
            <SelectItem value="license">License</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="background_check">Background Check</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value: 'priority' | 'date') => setSortBy(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Sort by Priority</SelectItem>
            <SelectItem value="date">Sort by Date</SelectItem>
          </SelectContent>
        </Select>
        {/* Batch Assign removed - Core features only */}
      </div>

      {/* Queue Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                <TableHead className="hidden lg:table-cell">Processing Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No verifications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span>{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {item.user?.full_name || item.user_id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.user?.email || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(item.submitted_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {item.assigned_to?.full_name || 'Unassigned'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {item.processing_time
                        ? `${item.processing_time}h`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewVerification(item)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batch Assign Dialog removed - Core features only */}
    </div>
  );
}


