'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Filter, Loader2, Download, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
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
import { Skeleton } from '../ui/skeleton';
import { adminService } from '@/src/lib/api/adminService';

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

// Get time ago
const getTimeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function AdminActivityLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [adminIdFilter, setAdminIdFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Fetch admin logs
  const { data: logsData, isLoading: logsLoading, refetch } = useQuery({
    queryKey: [
      'admin-activity-logs',
      adminIdFilter,
      actionFilter,
      resourceTypeFilter,
      dateFrom,
      dateTo,
      limit,
      offset,
    ],
    queryFn: () => adminService.getAdminActivityLogs({
      admin_id: adminIdFilter || undefined,
      action: actionFilter && actionFilter !== 'all' ? actionFilter : undefined,
      resource_type: resourceTypeFilter && resourceTypeFilter !== 'all' ? resourceTypeFilter : undefined,
      date_from: dateFrom?.toISOString(),
      date_to: dateTo?.toISOString(),
      limit,
      offset,
    }),
  });

  const logs = logsData?.data || [];
  const total = logsData?.total || 0;

  // Filter logs by search
  const filteredLogs = logs.filter((log: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(query) ||
      log.user?.full_name?.toLowerCase().includes(query) ||
      log.user?.email?.toLowerCase().includes(query) ||
      log.metadata?.toString().toLowerCase().includes(query)
    );
  });

  const getActionBadge = (action: string) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return <Badge className="bg-red-100 text-red-700">Delete</Badge>;
    }
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return <Badge className="bg-green-100 text-green-700">Create</Badge>;
    }
    if (actionLower.includes('update') || actionLower.includes('modify')) {
      return <Badge className="bg-blue-100 text-blue-700">Update</Badge>;
    }
    if (actionLower.includes('approve') || actionLower.includes('accept')) {
      return <Badge className="bg-green-100 text-green-700">Approve</Badge>;
    }
    if (actionLower.includes('reject') || actionLower.includes('deny')) {
      return <Badge className="bg-red-100 text-red-700">Reject</Badge>;
    }
    return <Badge variant="secondary">{action || 'Action'}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Activity Logs</h1>
          <p className="text-gray-600 mt-1">Complete audit trail of all administrative actions</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const blob = await adminService.exportAdminLogs({
                admin_id: adminIdFilter || undefined,
                action: actionFilter || undefined,
                date_from: dateFrom?.toISOString(),
                date_to: dateTo?.toISOString(),
              });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `admin-logs-export-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (error: any) {
              console.error('Failed to export logs:', error);
            }
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export for Compliance
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Logs</p>
              <p className="text-2xl font-bold mt-1">{total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Showing</p>
              <p className="text-2xl font-bold mt-1">{filteredLogs.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by action, user, or metadata..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Admin User</Label>
              <Input
                placeholder="Admin ID or email"
                value={adminIdFilter}
                onChange={(e) => setAdminIdFilter(e.target.value)}
              />
            </div>
            <div>
              <Label>Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="suspend">Suspend</SelectItem>
                  <SelectItem value="verify">Verify</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resource Type</Label>
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="dispute">Dispute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PPP') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PPP') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAdminIdFilter('');
                  setActionFilter('');
                  setResourceTypeFilter('');
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <Filter className="h-4 w-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No logs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time Ago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(log.created_at || log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.admin?.full_name || log.admin_id || 'System'}</div>
                        {log.admin?.email && (
                          <div className="text-sm text-gray-500">{log.admin.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline">{log.resource_type || 'N/A'}</Badge>
                        {log.resource_id && (
                          <p className="text-xs text-gray-500 mt-1">{log.resource_id}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-sm text-gray-900">{log.action || 'N/A'}</p>
                        {log.changes && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {typeof log.changes === 'string' 
                              ? log.changes 
                              : JSON.stringify(log.changes)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {getTimeAgo(log.created_at || log.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0 || logsLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total || logsLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

