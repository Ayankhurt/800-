'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService } from '@/src/lib/api/adminService';

// Define AuditLog type locally
interface AuditLog {
  id: string;
  admin_id?: string;
  user_id?: string;
  action: string;
  action_type?: string;
  action_description?: string;
  target_resource?: string;
  target_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
  user?: {
    full_name?: string;
    email?: string;
  };
  resource_type?: string;
}
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import {
  Search,
  Calendar as CalendarIcon,
  FileText,
  Shield,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState('logs');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="logs">
        <ActivityLogsTab />
      </TabsContent>

      <TabsContent value="compliance">
        <ComplianceReportsTab />
      </TabsContent>
    </Tabs>
  );
}

function ActivityLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    date_from: undefined as Date | undefined,
    date_to: undefined as Date | undefined,
    action_type: 'all',
    user_id: '',
    resource_type: 'all',
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.date_from) params.date_from = filters.date_from.toISOString();
      if (filters.date_to) params.date_to = filters.date_to.toISOString();
      if (filters.action_type && filters.action_type !== 'all') params.action_type = filters.action_type;
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.resource_type && filters.resource_type !== 'all') params.resource_type = filters.resource_type;

      const response = await adminService.getAuditLogs(params);
      if (response.success) {
        setLogs(response.data.logs || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    let filtered = logs;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action_description?.toLowerCase().includes(query) ||
          log.user?.full_name?.toLowerCase().includes(query) ||
          log.resource_type?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [logs, searchQuery]);

  // Export removed - Core features only

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Audit Logs</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            View and search all system activity logs
          </p>
        </div>
        {/* Export removed - Core features only */}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search logs by description, user, or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal',
                  !filters.date_from && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date_from
                  ? format(filters.date_from, 'PPP')
                  : 'Date From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.date_from}
                onSelect={(date) => setFilters({ ...filters, date_from: date })}
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
                  !filters.date_to && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date_to
                  ? format(filters.date_to, 'PPP')
                  : 'Date To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.date_to}
                onSelect={(date) => setFilters({ ...filters, date_to: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select
            value={filters.action_type}
            onValueChange={(value) => setFilters({ ...filters, action_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="view">View</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="User ID"
            value={filters.user_id}
            onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Resource</TableHead>
                <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {log.user?.full_name || log.user_id || 'System'}
                    </TableCell>
                    <TableCell>
                      <Badge>{log.action_type}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {log.resource_type || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-sm">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{log.action_description}</p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ComplianceReportsTab() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('access');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom.toISOString();
      if (dateTo) params.date_to = dateTo.toISOString();

      const response = await adminService.getComplianceReports(reportType, params);
      if (response.success) {
        toast.success('Report generated');
        // Handle report display/download
      }
    } catch (error: any) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Compliance Reports</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Generate compliance and audit reports
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="access">Access Report</SelectItem>
                <SelectItem value="change">Change Report</SelectItem>
                <SelectItem value="security">Security Incident Report</SelectItem>
                <SelectItem value="gdpr">GDPR Compliance Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                  {dateFrom ? format(dateFrom, 'PPP') : 'Date From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
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
                  {dateTo ? format(dateTo, 'PPP') : 'Date To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleGenerateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


