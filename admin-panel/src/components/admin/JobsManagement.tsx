'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, Job } from '@/src/lib/api/adminService';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import {
  Search,
  MoreVertical,
  Eye,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { JobFilters, JobFilters as JobFiltersType } from './JobFilters';
import { JobDetailView } from './JobDetailView';

export default function JobsManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // Fixed limit per page

  // Bulk actions removed - Core features only
  const [filters, setFilters] = useState<JobFiltersType>({});
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  // Flag dialog removed - Core features only

  useEffect(() => {
    loadJobs();
  }, [filters, page]); // Reload when filters or page changes

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };
      if (filters.status) params.status = filters.status;
      if (filters.trade_type) params.trade_type = filters.trade_type;
      if (filters.date_from) params.date_from = filters.date_from instanceof Date ? filters.date_from.toISOString() : filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to instanceof Date ? filters.date_to.toISOString() : filters.date_to;
      if (filters.budget_min) params.budget_min = filters.budget_min;
      if (filters.budget_max) params.budget_max = filters.budget_max;
      if (filters.location) params.location = filters.location;
      if (filters.posted_by) params.posted_by = filters.posted_by;

      const response = await adminService.getAllJobs(params);
      if (response.success) {
        setJobs(response.data.jobs || []);
        // Update pagination from response
        if (response.data.pages) {
          setTotalPages(response.data.pages);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let filtered = jobs;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [jobs, searchQuery]);

  // Bulk actions, export, and flag removed - Core features only

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      open: { label: 'Open', className: 'bg-green-500' },
      in_progress: { label: 'In Progress', className: 'bg-blue-500' },
      completed: { label: 'Completed', className: 'bg-gray-500' },
      cancelled: { label: 'Cancelled', className: 'bg-red-500' },
      closed: { label: 'Closed', className: 'bg-orange-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Bulk selection removed - Core features only

  if (selectedJobId) {
    return (
      <JobDetailView
        jobId={selectedJobId}
        onBack={() => setSelectedJobId(null)}
        onUpdate={() => {
          loadJobs();
          setSelectedJobId(null);
        }}
      />
    );
  }

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Jobs Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage all jobs posted on the platform
          </p>
        </div>
        <div className="flex gap-2">
          {/* Export removed - Core features only */}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search jobs by title, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <JobFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() => setFilters({})}
        />
        {/* Bulk Actions removed - Core features only */}
      </div>

      {/* Jobs Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Trade Type</TableHead>
                <TableHead className="hidden lg:table-cell">Budget</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden xl:table-cell">Posted By</TableHead>
                <TableHead className="hidden xl:table-cell">Applications</TableHead>
                <TableHead className="hidden xl:table-cell">Posted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No jobs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{job.title}</p>
                          {/* Featured flag is not in schema yet, commenting out to avoid confusion */}
                          {/* {job.featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )} */}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {job.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {job.trade_type || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {/* Handle Budget Range or Single Budget */}
                      {job.budget_min || job.budget_max ? (
                        // If we have min/max, show range
                        `$${(job.budget_min || 0).toLocaleString()} - $${(job.budget_max || 0).toLocaleString()}`
                      ) : job.budget ? (
                        // Fallback to 'budget' if it exists
                        `$${job.budget.toLocaleString()}`
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {job.location || '-'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {job.posted_by?.full_name || job.posted_by?.email || '-'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {/* Handle Singular vs Plural field names from Backend */}
                      {job.application_count || job.applications_count || 0}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {job.created_at
                        ? format(new Date(job.created_at), 'MMM dd, yyyy')
                        : '-'}
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
                            onClick={() => setSelectedJobId(job.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              if (
                                confirm(
                                  'Are you sure you want to delete this job?'
                                )
                              ) {
                                try {
                                  const response = await adminService.deleteJob(
                                    job.id
                                  );
                                  if (response.success) {
                                    toast.success('Job deleted');
                                    loadJobs();
                                  }
                                } catch (error: any) {
                                  toast.error('Failed to delete job');
                                }
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flag Dialog removed - Core features only */}
      {/* Bulk Notify Dialog removed - Core features only */}
    </div>
  );
}

