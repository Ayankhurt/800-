'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, LoginLog, LoginStats } from '@/src/lib/api/adminService';
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
import { CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export default function LoginLogs() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    email: '',
    success: undefined as boolean | undefined,
  });

  const loadLogs = async () => {
    try {
      const response = await adminService.getLoginLogs({
        ...filters,
        limit: 50,
        page: 1,
      });
      if (response.success) {
        setLogs(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load login logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminService.getLoginStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load statistics');
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Failed Attempts (30d)</p>
                  <p className="text-2xl font-bold">{stats.failed_attempts_last_30_days}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Successful Logins (30d)</p>
                  <p className="text-2xl font-bold">{stats.successful_logins_30_days}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Top IPs</p>
                <div className="space-y-1">
                  {stats.top_ips.slice(0, 3).map((ip, idx) => (
                    <p key={idx} className="text-sm">
                      {ip.ip}: {ip.count}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Top Devices</p>
                <div className="space-y-1">
                  {stats.top_devices.slice(0, 3).map((device, idx) => (
                    <p key={idx} className="text-sm">
                      {device.device}: {device.count}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Filter by email"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              className="max-w-xs"
            />
            <Select
              value={filters.success === undefined ? 'all' : filters.success ? 'success' : 'failed'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  success: value === 'all' ? undefined : value === 'success',
                })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Login Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No logs found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.email_attempted}</TableCell>
                    <TableCell>
                      {log.success ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{log.ip_address}</TableCell>
                    <TableCell>{log.device}</TableCell>
                    <TableCell>{log.reason || '-'}</TableCell>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

