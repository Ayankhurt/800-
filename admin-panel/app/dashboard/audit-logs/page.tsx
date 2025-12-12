'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/src/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/ui/select';
import { Search, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AuditLog {
    id: string;
    admin_id: string;
    admin_email?: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details?: any;
    ip_address?: string;
    created_at: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => {
        loadAuditLogs();
    }, [page, limit, actionFilter]);

    const loadAuditLogs = async () => {
        try {
            setLoading(true);
            const response = await adminService.getAuditLogs({
                page,
                limit,
                action: actionFilter || undefined,
                search: searchQuery || undefined,
            });

            if (response.success && response.data) {
                setLogs(response.data.logs || []);
                setTotalPages(response.data.pages || 1);
            }
        } catch (error: any) {
            console.error('Failed to load audit logs:', error);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('create')) return <Badge className="bg-green-500">Create</Badge>;
        if (actionLower.includes('update') || actionLower.includes('edit')) return <Badge className="bg-blue-500">Update</Badge>;
        if (actionLower.includes('delete')) return <Badge className="bg-red-500">Delete</Badge>;
        if (actionLower.includes('suspend')) return <Badge className="bg-yellow-500">Suspend</Badge>;
        if (actionLower.includes('verify')) return <Badge className="bg-purple-500">Verify</Badge>;
        return <Badge className="bg-gray-500">{action}</Badge>;
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
        } catch {
            return dateString;
        }
    };

    if (loading && logs.length === 0) {
        return (
            <div className="p-6">
                <div className="text-center py-8">Loading audit logs...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-gray-600 mt-1">Track all admin actions and system changes</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search by admin email, resource ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs()}
                                className="pl-10"
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Actions</SelectItem>
                                <SelectItem value="create_user">Create User</SelectItem>
                                <SelectItem value="update_user">Update User</SelectItem>
                                <SelectItem value="delete_user">Delete User</SelectItem>
                                <SelectItem value="suspend_user">Suspend User</SelectItem>
                                <SelectItem value="verify_user">Verify User</SelectItem>
                                <SelectItem value="update_role">Update Role</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val)); setPage(1); }}>
                            <SelectTrigger className="w-full md:w-[140px]">
                                <SelectValue placeholder="Rows per page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 per page</SelectItem>
                                <SelectItem value="25">25 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                                <SelectItem value="100">100 per page</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={loadAuditLogs} variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Apply
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Activity Log ({logs.length} records)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Resource</TableHead>
                                    <TableHead>Resource ID</TableHead>
                                    <TableHead>IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            No audit logs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-sm text-gray-600">
                                                {formatDate(log.created_at)}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {log.admin_email || log.admin_id}
                                            </TableCell>
                                            <TableCell>{getActionBadge(log.action)}</TableCell>
                                            <TableCell className="capitalize">{log.resource_type}</TableCell>
                                            <TableCell className="font-mono text-xs text-gray-600">
                                                {log.resource_id?.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {log.ip_address || 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex items-center justify-between border-t pt-4">
                        <div className="text-sm text-gray-600">
                            Showing page <span className="font-semibold">{page}</span> of{' '}
                            <span className="font-semibold">{totalPages}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
