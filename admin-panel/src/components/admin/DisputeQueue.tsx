'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, Dispute } from '@/src/lib/api/adminService';
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
import {
  Search,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DisputeQueue() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
  });
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');

  useEffect(() => {
    loadDisputes();
  }, [filters, sortBy]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.type && filters.type !== 'all') params.type = filters.type;

      const response = await adminService.getAllDisputes(params);
      if (response.success) {
        let items = response.data.disputes || response.data || [];

        // Sort items
        if (sortBy === 'priority') {
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
          items = items.sort((a: Dispute, b: Dispute) =>
            (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
          );
        } else {
          items = items.sort((a: Dispute, b: Dispute) =>
            new Date(b.filing_date).getTime() - new Date(a.filing_date).getTime()
          );
        }

        setDisputes(items);
      }
    } catch (error: any) {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const filteredDisputes = useMemo(() => {
    let filtered = disputes;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dispute) =>
          dispute.id.toLowerCase().includes(query) ||
          dispute.description?.toLowerCase().includes(query) ||
          dispute.project?.title?.toLowerCase().includes(query) ||
          dispute.filed_by_user?.full_name?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [disputes, searchQuery]);

  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      payment: { label: 'Payment', className: 'bg-blue-500' },
      quality: { label: 'Quality', className: 'bg-orange-500' },
      scope: { label: 'Scope', className: 'bg-purple-500' },
      timeline: { label: 'Timeline', className: 'bg-yellow-500' },
      damage: { label: 'Damage', className: 'bg-red-500' },
    };
    const c = config[type] || { label: type, className: 'bg-gray-500' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      filed: { label: 'Filed', className: 'bg-yellow-500' },
      internal_resolution: { label: 'Internal Resolution', className: 'bg-blue-500' },
      mediation: { label: 'Mediation', className: 'bg-purple-500' },
      arbitration: { label: 'Arbitration', className: 'bg-red-500' },
      resolved: { label: 'Resolved', className: 'bg-green-500' },
    };
    const c = config[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={c.className}>{c.label}</Badge>;
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

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dispute Queue</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Manage and track all disputes
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search disputes by ID, description, project, or parties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="filed">Filed</SelectItem>
              <SelectItem value="internal_resolution">Internal Resolution</SelectItem>
              <SelectItem value="mediation">Mediation</SelectItem>
              <SelectItem value="arbitration">Arbitration</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters({ ...filters, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="scope">Scope</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
              <SelectItem value="damage">Damage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
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
        </div>
      </div>

      {/* Disputes Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Project</TableHead>
                <TableHead className="hidden md:table-cell">Filed By</TableHead>
                <TableHead className="hidden lg:table-cell">Amount</TableHead>
                <TableHead className="hidden lg:table-cell">Priority</TableHead>
                <TableHead className="hidden xl:table-cell">Filed Date</TableHead>
                <TableHead className="hidden xl:table-cell">Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    No disputes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-sm">{dispute.id.slice(0, 8)}...</TableCell>
                    <TableCell>{getTypeBadge(dispute.type)}</TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {dispute.project?.title || dispute.project_id}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {dispute.filed_by_user?.full_name || dispute.filed_by}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      ${dispute.amount_disputed.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {getPriorityBadge(dispute.priority)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {format(new Date(dispute.filing_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {dispute.deadline ? (
                        <div className="flex items-center gap-1">
                          {isOverdue(dispute.deadline) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={isOverdue(dispute.deadline) ? 'text-red-600' : ''}>
                            {format(new Date(dispute.deadline), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/disputes/${dispute.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
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


